import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import Consultation from 'App/Models/Consultation'
import { DateTime } from 'luxon'

// import Logger from '@ioc:Adonis/Core/Logger'

export default class ConsultationsController {

    public async index({ request }: HttpContextContract) {
        let qs = request.qs()
        let date = qs.date || null
        let page = qs.page || 1
        let size = qs.size || 15

        let consultations = Consultation.query()
            .preload('doctor')
            .preload('callbackStatus')
            .preload('patient')
            // .preload('patient')
            
        if (date) {
            consultations.whereRaw('date(callback_datetime) = ?', [date])
        }

        return await consultations.paginate(page, size)
    }

    /* 
     * TODO:
     * Check if doctor is available 
     * Check if patient is available 
     * Get doctor consultation & followup fee 
     * In app Notify doctor
     * Email/Sms patient
     */
    public async store({ auth, request }: HttpContextContract) {
        const newConsultationSchema = schema.create({
            doctor_id: schema.number(),
            patient_id: schema.number(),
            callback_date: schema.date({
                format: 'yyyy-MM-dd',
            }, [rules.afterOrEqual('today'), ]),
        })

        const user: any = auth.user;

        // Get this variables from .env
        const doctor_callgap_duration = 5; // in minutes
        const max_call_duration = 10; // in minutes
        const call_duration_and_gap = doctor_callgap_duration + max_call_duration;

        // TODO: get this times from database (config module)
        const office_start_time = "09:00:00", office_end_time = "17:00:00";   

        try {
            let payload = await request.validate({ schema: newConsultationSchema })

            const callback_date = DateTime.fromISO(payload.callback_date.toString()).toFormat('yyyy-MM-dd');

            //.toFormat('yyyy-MM-dd HH:mm:ss'),
            const office_start_datetime = DateTime.fromISO(`${callback_date}T${office_start_time}`),
            office_end_datetime = DateTime.fromISO(`${callback_date}T${office_end_time}`);

            let callback_start_time = DateTime.now() > office_start_datetime
                ? DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss')
                : office_start_datetime.toFormat('yyyy-MM-dd HH:mm:ss');

            let doctor_callback_counts = await Database.rawQuery(`
                SELECT a.id, a.name, COUNT(b.id) as consultations_count, 
                    CONCAT(MAX(b.callback_datetime), '') as max_callback_datetime, 
                    GROUP_CONCAT(b.callback_datetime) as callback_datetime_list
                FROM users as a
                LEFT JOIN consultations as b ON a.id = b.doctor_id
                    AND b.callback_status_id IN (:callback_statuses)
                    AND DATE_FORMAT(b.callback_datetime, "%Y-%m-%d") = :callback_date
                WHERE a.user_type_id = 2
                    AND a.is_active = 1
                GROUP BY a.id
                ORDER BY count(b.id)`, 
                {
                    callback_statuses: [1, 4],
                    callback_date: callback_date
                }
            )
            //.toQuery()

            doctor_callback_counts = doctor_callback_counts[0];

            let selected_doctor : any = null;
            let selected_callback_time : any = null;

            for (let doctor of doctor_callback_counts) {
                selected_doctor = doctor
                if (doctor.consultations_count == 0) {
                    selected_callback_time = callback_start_time;
                    break;
                }

                let doctor_callback_time = DateTime.fromSQL(doctor.max_callback_datetime)
                    .plus({ minutes: call_duration_and_gap })

                selected_callback_time = doctor_callback_time > DateTime.fromSQL(callback_start_time)
                    ? doctor_callback_time
                    : DateTime.fromSQL(callback_start_time);

                selected_callback_time = selected_callback_time > office_end_datetime
                    ? null
                    : selected_callback_time;


                if (selected_callback_time) {
                    selected_callback_time = selected_callback_time.toFormat('yyyy-MM-dd HH:mm:ss')
                    break;
                }
            }

            if (selected_doctor == null || selected_callback_time == null) {
                return {
                    status: 'error',
                    message: `No available doctor found for date: ${callback_date}`
                }
            }

            let saveData = {
                doctorId: selected_doctor.id,
                patientId: payload.patient_id,
                callbackDatetime: selected_callback_time,
                callbackStatusId: 1, // 1 - Accepted
                consultationFee: 250, // TODO: consultation & followup fee need to get from doctor profile
                followupFee: 250, // TODO: consultation & followup fee need to get from doctor profile
                createdByUserId: user.id,
                autoExpireAt: DateTime.fromISO(`${callback_date}T23:59:00`)
            }
    
            const consultation = await Consultation.create(saveData)
    
            return consultation
        } catch (error) {
            // response.badRequest(error.messages)
            return error
        }
    }


    

}
