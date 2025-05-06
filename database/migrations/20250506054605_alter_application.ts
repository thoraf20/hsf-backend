import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('application', (table) => {
    table.dropForeign('property_closing_id')

    table
      .foreign('property_closing_id')
      .references('property_closing_id')
      .inTable('property_closing')
      .onDelete('SET NULL')
  })
}

export async function down(knex: Knex): Promise<void> {}
