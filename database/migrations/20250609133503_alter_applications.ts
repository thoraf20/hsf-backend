import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('application', (table) => {
    table
      .uuid('condition_precedent_id')
      .references('id')
      .inTable('condition_precedents')
      .nullable()
      .onDelete('SET NULL')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('application', (table) => {
    table.dropColumn('condition_precedent_id')
  })
}
