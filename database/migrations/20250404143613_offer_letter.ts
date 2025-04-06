import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('offer_letter', (table) => {
    table
      .uuid('offer_letter_id')
      .primary()
      .defaultTo(knex.raw('gen_random_uuid()'))
    table.string('offer_letter_doc'), 
    table.boolean('offer_letter_requested')
    table.boolean('offer_letter_approved').defaultTo(false).notNullable()
    table.boolean('offer_letter_downloaded').defaultTo(false).notNullable()
    table.boolean('closed').defaultTo(false).notNullable()
    table.string('offer_letter_status').defaultTo('Pending')
    table.timestamps(true, true)
    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .onUpdate('CASCADE')
      table
      .uuid('property_id')
      .notNullable()
      .references('id')
      .inTable('properties')
      .onDelete('CASCADE')
      .onUpdate('CASCADE')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('offer_letter')
}
