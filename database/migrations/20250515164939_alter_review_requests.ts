import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('review_request_stages', (table) => {
    table.text('organization_type').notNullable()
  })

  await knex.schema.alterTable('review_request_type_stages', (table) => {
    table.boolean('enabled').defaultTo(false)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('review_request_stages', (table) => {
    table.dropColumn('organization_type')
  })

  await knex.schema.alterTable('review_request_type_stages', (table) => {
    table.dropColumn('enabled')
  })
}
