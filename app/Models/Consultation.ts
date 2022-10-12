import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import CallbackStatus from './CallbackStatus'
import User from './User'

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

  @column.dateTime()
  public autoExpireAt: DateTime

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => CallbackStatus)
  public callbackStatus: BelongsTo<typeof CallbackStatus>
  
  @belongsTo(() => User, {
    // localKey: 'doctorId',
    foreignKey: 'doctorId'
  })
  public doctor: BelongsTo<typeof User>

  @belongsTo(() => User, {
    // localKey: 'doctorId',
    foreignKey: 'patientId'
  })
  public patient: BelongsTo<typeof User>
}
