import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('escrow_information', (table) => {
    table.text('meeting_details').nullable()
    table.string('agent_phone_number').nullable()
    table.string('agent_name').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('escrow_information', (table) => {
    table.dropColumn('meeting_details')
    table.dropColumn('agent_phone_number')
    table.dropColumn('agent_name')
  })
}
