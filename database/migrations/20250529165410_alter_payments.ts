import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('payments', (table) => {
    table.text('currency').nullable()
    table.text('email').nullable()
    table.text('reference').notNullable()
    table.jsonb('metadata').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('payments', (table) => {
    table.dropColumn('currency')
    table.dropColumn('email')
    table.dropColumn('reference')
    table.dropColumn('metadata')
  })
}
