import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('document_decline_events', function (table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.uuid('application_document_entry_id').notNullable()
    table
      .foreign('application_document_entry_id')
      .references('id')
      .inTable('application_document_entries')
      .onDelete('CASCADE')

    table.uuid('review_request_approval_id')

    table
      .foreign('review_request_approval_id')
      .references('id')
      .inTable('review_request_approvals')

    table.uuid('declined_by_user_id')
    table
      .foreign('declined_by_user_id')
      .references('id')
      .inTable('users') // Assuming a 'users' table exists for linking
      .onDelete('SET NULL')

    table.text('notes')
    table.timestamp('declined_at').notNullable().defaultTo(knex.fn.now())

    table.index('application_document_entry_id')
    table.index('declined_by_user_id')
    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('document_decline_events')
}
