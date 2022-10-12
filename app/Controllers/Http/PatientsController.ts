import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import Consultation from 'App/Models/Consultation'
import Patient from 'App/Models/Patient'
import User from 'App/Models/User'

export default class PatientsController {
    public async store({ request }: HttpContextContract) {
        const newPatientSchema = schema.create({
            name: schema.string(),
            userid: schema.string([
                rules.unique({ table: 'users', column: 'userid' }),
            ]),
            email: schema.string.nullable([
                rules.email(),
            ]),
            password: schema.string([
                rules.minLength(4)
            ]),
            dob: schema.date.nullable({ format: 'yyyy-MM-dd' }),
            gender: schema.string.nullable(),
            weight: schema.string.nullable(),
            height: schema.string.nullable(),
            blood_group: schema.string.nullable(),
        })
        
        try {
            const payload = await request.validate({ schema: newPatientSchema })            
            let dob = payload.dob ? payload.dob.toString().split('T')[0] : null;

            await Database.transaction(async (trx) => {
                const user = new User()
                user.name = payload.name;
                user.userid = payload.userid;
                user.email = payload.email;
                user.password = payload.password;
                user.isActive = true;
                user.userTypeId = 3;

                user.useTransaction(trx)
                await user.save()

                await user.related('patients').create({
                    name: payload.name,
                    dob: dob,
                    gender: payload.gender,
                    relationship: 'self',
                    weight: payload.weight,
                    height: payload.height,
                    bloodGroup: payload.blood_group,
                    isActive: true,
                })
            })

            return {
                status: 'success',
                message: 'Patient created successfully'
            }
        } catch (error) {
            return error
            // response.badRequest(error.messages)
        }
    }

    public async createFamilyMember({ request }: HttpContextContract) {
        let newPatientSchema = schema.create({
            name: schema.string(),
            user_id: schema.number(),
            dob: schema.date.nullable({ format: 'yyyy-MM-dd' }),
            gender: schema.string.nullable(),
            weight: schema.string.nullable(),
            height: schema.string.nullable(),
            blood_group: schema.string.nullable(),
            relationship: schema.string(),
        })
        
        try {
            const payload = await request.validate({ schema: newPatientSchema })            

            const patient = await Patient.create({
                ...payload,
                dob: payload.dob ? payload.dob.toString().split('T')[0] : null
            });

            return {
                status: 'success',
                message: 'Patient created successfully',
                patient
            }
        } catch (error) {
            return error
            // response.badRequest(error.messages)
        }
    }


    public async getConsultations ({ params, auth, request }: HttpContextContract) {
        let qs = request.qs()
        let date = qs.date || null
        let page = qs.page || 1
        let size = qs.size || 15

        let patient_id = params.patient_id

        let patient : any = await Patient.find(patient_id)

        let patientUser : any = auth.user
        
        if (patientUser.id != patient.userId) {
            return {
                status: 'error',
                message: 'Unauthorized access'
            }
        }

        // await doctor.load('doctorConsultations')

        let consultations = Consultation.query()
            .where('patient_id', patient.id)
            .preload('doctor')
            .preload('callbackStatus')
            // .preload('patient')
            
        if (date) {
            consultations.whereRaw('date(callback_datetime) = ?', [date])
        }

        return await consultations.paginate(page, size)

        // let data = await consultations.paginate(page, size)
        // return response.ok(data)
    }
}
