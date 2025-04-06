import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('escrow_information', (table) => {
    table
      .uuid('escrow_id')
      .primary()
      .defaultTo(knex.raw('gen_random_uuid()'))
    table.string('date').notNullable(), 
    table.string('time').notNullable(),
    table.string('location').notNullable(),
    table.string('attendees').notNullable(),
    table.string('property_name').notNullable(),
    table.string('property_types').notNullable(),
    table.boolean('confirm_attendance').defaultTo(false).notNullable(),
    table.timestamps(true, true)
    table
      .uuid('property_id')
      .notNullable()
      .references('id')
      .inTable('properties')
      .onDelete('CASCADE')
      .onUpdate('CASCADE')

    table
      .uuid('property_buyer_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .onUpdate('CASCADE')
    table
      .uuid('agent_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .onUpdate('CASCADE')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('escrow_information')
}
