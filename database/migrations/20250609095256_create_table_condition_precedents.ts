import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('condition_precedents', function (table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table
      .uuid('application_id')
      .notNullable()
      .references('application_id')
      .inTable('application')
      .onDelete('CASCADE')

    table.string('status', 50)
    table.date('due_date').nullable()
    table.date('completed_date').nullable()
    table.text('notes').nullable()
    table.boolean('documents_uploaded').defaultTo(false)
    table.string('documents_status', 50).nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('condition_precedents')
}
