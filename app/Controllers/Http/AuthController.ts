import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'

export default class AuthController {
    public async login({ logger, auth, request, response }: HttpContextContract) {
        logger.info("Login Request Hello");

        const loginSchema = schema.create({
            userid: schema.string(),
            password: schema.string(),
        })
        
        try {
            await request.validate({ schema: loginSchema })

            const userid = request.input('userid')
            const password = request.input('password')

            const token = await auth.use('api').attempt(userid, password, {
                name: 'VIVO Y20'
            })
            return token
        } catch (error) {
            return response.unauthorized(error.messages)
        }
    }
}
