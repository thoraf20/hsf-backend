import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('inspection', (table) => {
    table.dropColumn('inspection_meeting_type')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('inspection', (table) => {
    table.string('inspection_meeting_type').notNullable()
  })
}
