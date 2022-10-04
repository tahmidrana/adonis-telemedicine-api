import { DateTime } from 'luxon'
import { BaseModel, column, HasOne, hasOne } from '@ioc:Adonis/Lucid/Orm'
import CallbackStatus from './CallbackStatus'

export default class Consultation extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public doctorId: number
  
  @column()
  public patientId: number
  
  @column()
  public callbackDatetime: string
  
  @column()
  public callbackStatusId: number
  
  @column()
  public consultationFee: number
  
  @column()
  public followupFee: number

  @column()
  public createdByUserId: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @hasOne(() => CallbackStatus)
  public callbackStatus: HasOne<typeof CallbackStatus>
}
