import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('users', (table) => {
    table
    .boolean('force_password_reset')
    .notNullable().defaultTo(false)
    table.string('ip_address').nullable().defaultTo(null)
    table.string('os').nullable().defaultTo(null)
    table.string('browser').nullable().defaultTo(null)
    table.string('device').nullable().defaultTo(null)
    })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('force_password_reset')
    table.dropColumn('ip_address')
    table.dropColumn('os')
    table.dropColumn('browser')
    table.dropColumn('device')
  })
}
