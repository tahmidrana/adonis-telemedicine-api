import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'consultations'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('doctor_id').unsigned().notNullable().references('users.id')
      table.integer('patient_id').unsigned().notNullable().references('patients.id')
      table.timestamp('callback_datetime').notNullable()
      table.integer('callback_status_id').unsigned().notNullable()
      table.float('consultation_fee').notNullable()
      table.float('followup_fee').notNullable()
      table.integer('created_by_user_id').unsigned().notNullable().references('users.id')

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
