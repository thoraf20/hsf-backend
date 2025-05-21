import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('inspection', (table) => {
    table
      .uuid('application_id')
      .references('application_id')
      .inTable('application')
      .onDelete('CASCADE')
      .onUpdate('CASCADE')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('inspection', (table) => {
    table.dropColumn('application_id')
  })
}
