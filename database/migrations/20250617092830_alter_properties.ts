import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('properties', (table) => {
    table.text('property_description').nullable().alter()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('properties', (table) => {
    table.string('property_description').nullable()
  })
}
