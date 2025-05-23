import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('prequalify_status', (table) => {
    table.dropColumn('is_approved')
    table.text('status').defaultTo('Pending')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('prequalify_status', (table) => {
    table.dropColumn('status')
  })
}
