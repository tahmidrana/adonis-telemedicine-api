import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Consultation from 'App/Models/Consultation'
import { DateTime } from 'luxon'
// import moment from 'moment-timezone'
// import Logger from '@ioc:Adonis/Core/Logger'

export default class ConsultationsController {

    public async index({ auth, request, response }: HttpContextContract) {
        // logger.info("Hello");
        
        const user = auth.user || 'N/A'

        return user;
    }

    /* 
     * TODO:
     * Check if doctor is available 
     * Check if patient is available 
     * Get doctor consultation & followup fee 
     * In app Notify doctor
     * Email/Sms patient
     */
    public async store({ auth, request, response }: HttpContextContract) {
        const newConsultationSchema = schema.create({
            doctor_id: schema.number(),
            patient_id: schema.number(),
            callback_date: schema.date({
                format: 'yyyy-MM-dd',
            }, [rules.afterOrEqual('today'), ]),
        })

        try {
            let payload = await request.validate({ schema: newConsultationSchema })
    
            const callback_date = payload.callback_date.toString().split('T')[0]
            let callback_datetime = DateTime.fromISO(`${callback_date}T10:05:00`).toFormat('yyyy-MM-dd HH:mm:ss') // TODO: time to be calculated
            let saveData = {
                doctorId: payload.doctor_id,
                patientId: payload.patient_id,
                callbackDatetime: callback_datetime,
                callbackStatusId: 1, // 1 - Accepted
                consultationFee: 250, // TODO: consultation & followup fee need to get from doctor profile
                followupFee: 250, // TODO: consultation & followup fee need to get from doctor profile
                createdByUserId: auth.user.id
            }
    
            const consultation = await Consultation.create(saveData)
    
            return consultation
        } catch (error) {
            response.badRequest(error.messages)
        }
    }

}
