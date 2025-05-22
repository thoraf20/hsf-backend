import type { Knex } from 'knex'
export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('escrow_information', (table) => {
    table.dropColumn('attendees')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('escrow_information', (table) => {
    table.jsonb('attendees')
  })
}
