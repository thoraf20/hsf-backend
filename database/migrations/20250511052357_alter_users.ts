import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('users', (table) => {
    table.timestamp('last_logged_in_at').nullable()
    table.text('mfa_totp_secret').nullable()
    table.boolean('require_authenticator_mfa').defaultTo(false)
    table.jsonb('recovery_codes').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('last_logged_in_at')
    table.dropColumn('mfa_totp_secret')
    table.dropColumn('require_authenticator_mfa')
    table.dropColumn('recovery_codes')
  })
}
