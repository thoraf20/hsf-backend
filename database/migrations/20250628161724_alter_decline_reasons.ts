import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('decline_reasons', (table) => {
    table.string('category').notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('decline_reasons', (table) => {
    table.dropColumn('category')
  })
}
