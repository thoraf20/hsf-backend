import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('document_groups', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.string('name').notNullable().unique()
    table.string('tag').notNullable().unique()
    table.text('description')
    table.timestamps(true, true)
  })

  await knex.schema.createTable('group_document_types', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table
      .uuid('group_id')
      .notNullable()
      .references('id')
      .inTable('document_groups')
      .onDelete('CASCADE')
    table.string('document_type').notNullable() // Corresponds to enum string (e.g., DeveloperVerificationDocType)
    table.string('display_label')
    table.boolean('is_user_uploadable').notNullable().defaultTo(false)
    // Links to a role in the roles table to indicate who is expected to upload this type
    table
      .uuid('uploaded_by_role_id')
      .nullable()
      .references('id')
      .inTable('roles')
      .onDelete('SET NULL')
    table.boolean('is_required_for_group').notNullable().defaultTo(false)
    table.timestamps(true, true)
  })

  // Create application_documents table (for actual uploaded document files)
  await knex.schema.createTable('application_document_entries', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table
      .uuid('application_id')
      .notNullable()
      .references('application_id')
      .inTable('application')
      .onDelete('CASCADE')

    table
      .uuid('document_group_type_id')
      .notNullable()
      .references('id')
      .inTable('group_document_types')
      .onDelete('CASCADE')
    table.string('document_url').notNullable()
    table.string('document_name').notNullable()
    table.string('document_size')
    table
      .uuid('review_request_id')
      .nullable()
      .references('id')
      .inTable('review_requests')
      .onDelete('SET NULL')
    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order of dependency
  await knex.schema.dropTableIfExists('application_document_entries')
  await knex.schema.dropTableIfExists('group_document_types')
  await knex.schema.dropTableIfExists('document_groups')
}
