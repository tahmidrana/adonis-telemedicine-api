import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Consultation from 'App/Models/Consultation'

export default class DoctorsController {
    public async getConsultations ({ auth, request }: HttpContextContract) {
        let qs = request.qs()
        let date = qs.date || null
        let page = qs.page || 1
        let size = qs.size || 15

        let doctor : any = auth.user

        // await doctor.load('doctorConsultations')

        let consultations = Consultation.query()
            .where('doctor_id', doctor.id)
            // .preload('doctor')
            .preload('callbackStatus')
            .preload('patient')
            
        if (date) {
            consultations.whereRaw('date(callback_datetime) = ?', [date])
        }

        return await consultations.paginate(page, size)

        // let data = await consultations.paginate(page, size)
        // return response.ok(data)
    }
}
