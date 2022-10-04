import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import Patient from 'App/Models/Patient'
import User from 'App/Models/User'

export default class PatientsController {
    public async store({ auth, request, response }: HttpContextContract) {
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

    public async createFamilyMember({ auth, request, response }: HttpContextContract) {
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
            payload.dob = payload.dob ? payload.dob.toString().split('T')[0] : null;

            const patient = await Patient.create(payload);

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
}
