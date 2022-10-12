import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import User from './User'

export default class Patient extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string
  
  @column()
  public userId: number
  
  @column()
  public dob: string | null
  
  @column()
  public gender: string | null
  
  @column()
  public relationship: string
  
  @column()
  public weight: string | null
  
  @column()
  public height: string | null
  
  @column()
  public bloodGroup: string | null
  
  @column()
  public isActive: boolean

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>
}
