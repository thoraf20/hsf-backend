import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('eligibility', (table) => {
    table.dropColumn('prequalify_status_id')
  })
}

export async function down(knex: Knex): Promise<void> {}
