import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'calllogs'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('consultation_id').unsigned().notNullable().references('consultations.id')
      table.integer('callback_status_id').unsigned().notNullable().references('callback_statuses.id')
      table.smallint('calllog_type').unsigned().notNullable().comment('1 - Consultation, 2 - Followup')
      table.float('call_fee').notNullable().defaultTo(0)
      table.integer('call_duration').unsigned().notNullable().defaultTo(0).comment('duration in seconds')
      table.datetime('started_at')
      table.datetime('completed_at')
      table.boolean('is_prescription_provided').defaultTo(false)
      table.smallint('attempt_count').defaultTo(0).notNullable()

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
