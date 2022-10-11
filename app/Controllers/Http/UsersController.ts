import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import User from 'App/Models/User'

export default class UsersController {

    public async index(ctx: HttpContextContract) {
        // const doctor = await User.query().preload('doctorCategories')
        /* const doctor = await User.find(4)
        await doctor.load('doctorCategories')
        return doctor */
        
        const users = await User.all()
        return users
    }
    
    public async me({auth}: HttpContextContract) {        
        const user = auth.user
        await user.load('userType')

        if (user.userType.slug == 'patient') {
            await user.load('patients')
        }

        return user
    }

    public async store({ request, response }: HttpContextContract) {

        const newUserSchema = schema.create({
            name: schema.string(),
            userid: schema.string([
                rules.unique({ table: 'users', column: 'userid' }),
            ]),
            email: schema.string([
                rules.email(),
            ]),
            password: schema.string([
                rules.minLength(4)
            ]),
        })

        try {
            const payload = await request.validate({ schema: newUserSchema })

            const user = await User.create(payload)

            return user
        } catch (error) {
            response.badRequest(error.messages)
        }

    }


}
