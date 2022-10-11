async function create(req, res) {
    var params = req.allParams();
    var callbackId, callLogId;
    const doctor_callgap_duration = sails.config.appSettings.DOCTOR_CALL_GAP_DURATION; // in minutes
    const max_call_duration = sails.config.appSettings.MAX_CALL_DURATION; // in minutes
    const call_duration_and_gap = parseInt(doctor_callgap_duration) + parseInt(max_call_duration);
    
    if (!params.patientId || !params.date) {
        return res.status(500).json( { error: 'patientId & date field is required' })
    }    
    
    var nowGmt = new Date(),
        now = moment().tz(sails.config.env.timezone),
        date = moment(params.date).tz(sails.config.env.timezone),
        callback_date_formatted = moment(params.date).tz(sails.config.env.timezone).format('YYYY-MM-DD')
        hhmm = moment().tz(sails.config.env.timezone).format('HH:mm:ss'),
        weekday = date.format('d');


    // TODO: get this times from database (config module)
    const office_start_time = "09:00:00",
        office_end_time = "17:00:00";
    let office_start_datetime = moment(`${params.date}T${office_start_time}`),
        office_end_datetime = moment(`${params.date}T${office_end_time}`);

    let callback_start_time = now.format('YYYY-MM-DD HH:mm:ss')

    callback_start_time = moment(callback_start_time).isAfter(office_start_datetime) 
        ? moment(callback_start_time) 
        : office_start_datetime;

    params.patientId = parseInt(params.patientId)

    let nowTime = now.format('HH:mm:ss')


    let doctor_wise_callbacks = await knex('doctor as a')
        .leftJoin('callback as b', function() {
            this.on('a.id', '=', 'b.doctorId')
            .andOn('b.callbackDate', knex.raw('?', [callback_date_formatted] ) )
            .andOn('b.status', knex.raw('?', ["Accepted"]))
        })
        .where('a.isDisabled', 0)
        .groupBy('a.id')
        .orderBy(knex.raw('count(b.id)'))
        // .having(knex.raw('count(b.id)'), '>', 0) // TODO: remove this line (using test purpose)
        .select(
            'a.id', 'a.doctorCategoryId',
            knex.raw(`concat_ws(' ', a.title,a.firstName,a.lastName) as doctor_name`),
            knex.raw(`count(b.id) as consultation_count`),
            knex.raw(`group_concat(b.callbackTime) as callback_times`),
            knex.raw(`max(b.callbackTime) as max_callback_time`),
        )

    let selected_doctor = null;
    let selected_callback_time = null;
    for (doctor of doctor_wise_callbacks) { // TODO: need to check if patient is available
        selected_doctor = doctor;
        if (doctor.consultation_count == 0) {
            selected_callback_time = callback_start_time
            break;
        }

        let doctor_callback_time = moment(`${callback_date_formatted}T${doctor.max_callback_time}`)
            .add(call_duration_and_gap, 'minutes').format('YYYY-MM-DD HH:mm:ss')

        selected_callback_time = moment(doctor_callback_time).isAfter(callback_start_time)
            ? moment(doctor_callback_time)
            : callback_start_time;

        selected_callback_time = selected_callback_time.isAfter(office_end_datetime)
            ? null
            : selected_callback_time;

        if (selected_callback_time) {
            break;
        }
    }

    if (selected_doctor == null || selected_callback_time == null) {
        return res.status(200).json({
            status: 'error',
            message: `No available doctor found for date: ${params.date}`
        })
    }

    
    try {
        console.log(selected_callback_time);
        selected_callback_time = selected_callback_time.format('HH:mm:ss')

        let patientUser = await knex('patient as a')
            .join('user as b', 'a.userId', '=', 'b.id')
            .select('a.*', 'b.phone as userPhone', 'b.firstCallDone', 'b.oneSignalId', 'b.gcmapnsKey')
            .where('a.id', params.patientId)
            .first()
        if (!patientUser) {
            throw { errorSend: true, error: 'Patient user not found', status: 400 }
        }

        let data_to_return = {
            doctorName: selected_doctor.doctor_name,
            patientUserId: patientUser.userId,
        };

        await knex.transaction(async trx => {
            callLogId = await knex('calllog').insert({
            userId: patientUser.userId,
            patientId: params.patientId,
            doctorCategoryId: selected_doctor.doctorCategoryId,
            firstCall: !patientUser.firstCallDone,
            credits: 350,
            defaultCredits: 350,
            userPhone: patientUser.userPhone,
            patientPhone: patientUser.phone,
            createdAt: now.format('yyyy-MM-DD HH:mm:ss'),
            updatedAt: now.format('yyyy-MM-DD HH:mm:ss')
            }).transacting(trx)

            if (!patientUser.firstCallDone) {
            await knex.raw(`UPDATE user SET firstCallDone = true WHERE id = ${patientUser.userId}`).transacting(trx)
            }

            callbackId = await knex('callback').insert({
            doctorId: selected_doctor.id,
            patientId: params.patientId,
            // timeslotId: params.timeslotId,
            callbackDate: params.date,
            callbackTime: selected_callback_time,
            branchId: patientUser.branchId,
            callLogId: callLogId,
            status: 'Accepted',
            attempts: 0,
            isVideo: true,
            // autoRejectAt: new Date(moment().add(sails.config.appSettings.callbackRejectMin, 'minute').format('YYYY-MM-DDTHH:mm:ss')), // No auto reject
            // autoExpireAt: office_end_datetime.add(sails.config.appSettings.callbackExpireMin, 'minute').format('YYYY-MM-DDTHH:mm:ss'),
            autoExpireAt: moment(`${params.date}T23:59:59`).format('YYYY-MM-DDTHH:mm:ss'),
            createdAt: now.format('yyyy-MM-DD HH:mm:ss'),
            updatedAt: now.format('yyyy-MM-DD HH:mm:ss')
            }).transacting(trx)

            await knex('calllog')
            .where('id', callLogId)
            .update({
                callbackId: callbackId
            }).transacting(trx)
        })

        if (callLogId && callbackId) {
            let createdCallback = await Callback.findOne({ id: callbackId })
            if (!createdCallback) {
            throw { errorSend: true, error: 'Created callback not found', status: 400 }
            }

            data_to_return = {...data_to_return, ...createdCallback};

            const dt = moment(`${params.date}T${createdCallback.callbackTime}`).format('DD MMM, hh:mm a');
            let message = `You have an appointment request by ${patientUser.firstName.trim()} at ${dt}, 
            please respond in time else it will auto expire by ${moment(createdCallback.autoExpireAt).format('DD MMM, hh:mm a')}.`;

            NotificationService.sendNotification({
            doctorNotification: true,
            userId: selected_doctor.id,
            data: { callbackId: createdCallback.id, action: 'callback', speech: 'Callback request received', enableTalk: true },
            heading: 'New Appointment Request',
            message: message
            }).catch(error => {
            sails.log.info(`Notification Error: ${JSON.stringify(error)}`)
            console.error(error, error.stack)
            })

            /* SmsService.sendSms({
            isdCode: doctor.isdCode,
            to: doctor.phone,
            sender: 'DRTALK',
            body: `New Appointment Request: ${message}`
            }) */

            await knex.raw(`insert into doctor_calllog (doctorId, callLogId, sequence, answered) values
            (${createdCallback.doctorId}, ${callLogId}, 0, 0)`)

            // delete createdCallback.id;
            // delete patientCallbackLockMap[req.user.id];
        }

        return res.status(201).json({ 
            status: 'success', 
            message: 'Appointment created successfully',
            data: data_to_return
        })
        } catch (error) {
        if (error.errorSend) {
            let status = error.status || 500;
            return res.status(status).json(error)
        }
        return res.status(500).json({ error: error.message })
        }
    }