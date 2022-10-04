import { DateTime } from 'luxon'
import { BaseModel, column, ManyToMany, manyToMany } from '@ioc:Adonis/Lucid/Orm'
import User from './User'

export default class DoctorCategory extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public title: string
  
  @column()
  public imagePath: string
  
  @column()
  public isActive: boolean

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @manyToMany(() => User, {
    pivotForeignKey: 'doctor_category_id',
    pivotRelatedForeignKey: 'doctor_id',
    pivotTable: 'doctor_category_maps'
  })
  public doctors: ManyToMany<typeof User>
}
