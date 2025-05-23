import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('application', (table) => {
    table.dropForeign('prequalifier_id')
    table
      .foreign('prequalifier_id')
      .references('id')
      .inTable('prequalification_inputs')
  })
}

export async function down(knex: Knex): Promise<void> {}
