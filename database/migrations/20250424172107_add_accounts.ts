import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('accounts', (table) => {
    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
    table.string('type').notNullable()
    table.string('provider').notNullable()
    table.string('provider_account_id').notNullable()
    table.string('refresh_token')
    table.string('access_token')
    table.integer('expires_at')
    table.string('token_type')
    table.string('scope')

    table.primary(['provider', 'provider_account_id']) // Composite primary key
    table.index('user_id') // Add an index on user_id for faster lookups.

    table.comment('Accounts associated with a user, used for OAuth flows.') // Add a helpful comment.
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('accounts')
}
