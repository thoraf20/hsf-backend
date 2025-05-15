import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('offer_letter', (table) => {
    table
      .uuid('assigned_user_id')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
      .nullable()
    table.timestamp('approved_at').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('offer_letter', (table) => {
    table.dropColumn('assigned_user_id')
    table.dropColumn('approved_at')
  })
}
