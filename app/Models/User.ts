import { DateTime } from 'luxon'
import Hash from '@ioc:Adonis/Core/Hash'
import { column, beforeSave, BaseModel, manyToMany, ManyToMany, hasMany, HasMany, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import DoctorCategory from './DoctorCategory'
import Patient from './Patient'
import Consultation from './Consultation'
import UserType from './UserType'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public userid: string

  @column()
  public email: string | null

  @column()
  public isActive: boolean
  
  @column()
  public userTypeId: number

  @column({ serializeAs: null })
  public password: string

  @column()
  public rememberMeToken?: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeSave()
  public static async hashPassword (User: User) {
    if (User.$dirty.password) {
      User.password = await Hash.make(User.password)
    }
  }


  @manyToMany(() => DoctorCategory, {
    pivotForeignKey: 'doctor_id',
    pivotRelatedForeignKey: 'doctor_category_id',
    pivotTable: 'doctor_category_maps'
  })
  public doctorCategories: ManyToMany<typeof DoctorCategory>

  @hasMany(() => Patient)
  public patients: HasMany<typeof Patient>
  
  
  @hasMany(() => Consultation, {
    foreignKey: 'doctorId'
  })
  public doctorConsultations: HasMany<typeof Consultation>

  @belongsTo(() => UserType, {
    foreignKey: 'userTypeId'
  })
  public userType: BelongsTo<typeof UserType>
}
