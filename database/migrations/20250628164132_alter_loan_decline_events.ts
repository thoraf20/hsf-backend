import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('loan_decline_events', function (table) {
    table.string('reason').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('loan_decline_events', function (table) {
    table.dropColumn('reason')
  })
}
