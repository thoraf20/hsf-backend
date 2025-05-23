import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('prequalification_inputs', (table) => {
    table.renameColumn('employeer_name', 'employer_name')
  })
}

export async function down(knex: Knex): Promise<void> {}
