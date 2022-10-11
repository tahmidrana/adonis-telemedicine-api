import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import DoctorCategory from 'App/Models/DoctorCategory'

export default class DoctorCategoriesController {
    public async index() {
        const categories = await DoctorCategory.query()
            .where('is_active', true)

        return categories;
    }
    
    public async categoryWiseDoctors({ params }: HttpContextContract) {
        const categoryId = params.category_id
        try {
            const category = await DoctorCategory.findOrFail(categoryId)
    
            await category.load('doctors')
    
            return category.doctors;
            
        } catch (error) {
            return {
                status: 'error',
                message: error.message
            }
        }
    }
}
