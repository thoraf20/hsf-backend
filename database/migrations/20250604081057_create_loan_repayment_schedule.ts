import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('loan_repayment_schedules', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table
      .uuid('loan_id')
      .notNullable()
      .references('id')
      .inTable('loans')
      .onDelete('CASCADE')
      .onUpdate('CASCADE')

    table.integer('payment_number').notNullable()
    table.timestamp('due_date', { useTz: true }).notNullable()

    table.decimal('principal_due', 12, 2).notNullable()
    table.decimal('interest_due', 6, 2).notNullable()
    table.decimal('total_due', 12, 2).notNullable()

    table.string('status').notNullable()

    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('loan_repayment_schedule')
}
