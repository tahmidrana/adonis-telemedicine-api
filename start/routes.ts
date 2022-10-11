/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import Route from '@ioc:Adonis/Core/Route'

Route.get('/', async () => {
  return { status: 'Server is up & running' }
})

Route.group(() => {
  Route.get('/users/me', 'UsersController.me')
  
  Route.resource('users', 'UsersController').apiOnly()

  Route.resource('consultations', 'ConsultationsController').apiOnly()
  // Route.get('consultations/get-consultations-for-doctor', 'ConsultationsController.getConsultationsForDoctor')

  Route.get('/doctor/get-consultations', 'DoctorsController.getConsultations')
  
  
  Route.resource('patients', 'PatientsController').apiOnly()
  Route.post('patients/create-family-member', 'PatientsController.createFamilyMember')
  Route.get('/patients/:patient_id/get-consultations', 'PatientsController.getConsultations')

  Route.post('agora-token', 'AgoraTokensController.getToken')
}).middleware(['auth:api'])

Route.get('doctor-categories/:category_id/doctors', 'DoctorCategoriesController.categoryWiseDoctors')
Route.get('doctor-categories', 'DoctorCategoriesController.index')

// Auth Routes
Route.post('login', 'AuthController.login')