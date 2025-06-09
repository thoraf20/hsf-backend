import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('user_organization_memberships', (table) => {
    table.string('status').nullable()
    table.timestamp('deleted_at', { useTz: true }).nullable()
    table.timestamp('supended_at', { useTz: true }).nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('user_organization_memberships', (table) => {
    table.dropColumn('status')
    table.dropColumn('deleted_at')
    table.dropColumn('supended_at')
  })
}
