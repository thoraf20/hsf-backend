import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('loan_repayment_transactions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table
      .uuid('schedule_id')
      .references('id')
      .inTable('loan_repayment_schedules')
      .onDelete('CASCADE')
      .onUpdate('CASCADE')

    table
      .uuid('loan_id')
      .references('id')
      .inTable('loans')
      .onDelete('CASCADE')
      .onUpdate('CASCADE')

    table.uuid('transaction_id').notNullable()

    table.timestamp('payment_date', { useTz: true }).notNullable()
    table.decimal('amount_paid').notNullable()

    table.text('notes')

    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('loan_repayment_transaction')
}
