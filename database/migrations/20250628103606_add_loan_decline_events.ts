import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('loan_decline_events', function (table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.uuid('loan_id').notNullable()
    table
      .foreign('loan_id')
      .references('id')
      .inTable('loans')
      .onDelete('CASCADE')

    table.uuid('declined_by_user_id')
    table
      .foreign('declined_by_user_id')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')

    table.text('notes')
    table.timestamp('declined_at').notNullable().defaultTo(knex.fn.now())

    table.index('loan_id')
    table.index('declined_by_user_id')
    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('loan_decline_events')
}
