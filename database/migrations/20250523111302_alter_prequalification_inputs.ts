import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('prequalification_inputs', (table) => {
    table.date('date_of_birth').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('prequalification_inputs', (table) => {
    table.dropColumn('date_of_birth')
  })
}
