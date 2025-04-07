import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('payments', (table) => {
    table.string('payment_method').notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('payments', (table) => {
    table.dropColumn('payment_method')
  })
}
