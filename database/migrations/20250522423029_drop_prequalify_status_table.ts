import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('prequalify_status')
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.createTable('prequalify_status', (table) => {
    table.uuid('status_id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.boolean('verification').notNullable().defaultTo(false)
    table.timestamps(true, true)
    table
      .uuid('personal_information_id')
      .notNullable()
      .references('personal_information_id')
      .inTable('prequalify_personal_information')
      .onDelete('CASCADE')
      .onUpdate('CASCADE')
    table
      .uuid('loaner_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .onUpdate('CASCADE')
    table.string('reference_id').notNullable().defaultTo('')
    table.boolean('is_prequalify_requested').notNullable().defaultTo(false)
    table.text('status').defaultTo('Pending')
  })
}
