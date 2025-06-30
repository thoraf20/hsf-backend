import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('user_organization_memberships', (table) => {
    table.uuid('created_by_user_id').nullable()
    table
      .foreign('created_by_user_id')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
      .onUpdate('CASCADE')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('user_organization_memberships', (table) => {
    table.dropForeign('created_by_user_id')
    table.dropColumn('created_by_user_id')
  })
}
