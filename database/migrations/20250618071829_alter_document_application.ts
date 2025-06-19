import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('application_document_entries', (table) => {
    table
      .uuid('user_id')
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')

    table
      .uuid('uploaded_by_id')
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')

    table.timestamp('uploaded_at', { useTz: true }).nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('application_document_entries', (table) => {
    table.dropColumn('user_id')
    table.dropColumn('uploaded_by_id')
    table.dropColumn('uploaded_at')
  })
}
