import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('loan_decline_reasons', function (table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.uuid('loan_decline_event_id').notNullable()
    table
      .foreign('loan_decline_event_id')
      .references('id')
      .inTable('loan_decline_events')
      .onDelete('CASCADE')

    table.uuid('decline_reason_id').notNullable()
    table
      .foreign('decline_reason_id')
      .references('id')
      .inTable('decline_reasons')
      .onDelete('CASCADE')

    table.unique(['loan_decline_event_id', 'decline_reason_id'])

    table.index('decline_reason_id')

    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('loan_decline_reasons')
}
