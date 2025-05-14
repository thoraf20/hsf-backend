import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('addresses', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.string('street_address').notNullable()
    table.string('city').notNullable()
    table.string('state').notNullable()
    table.string('country').notNullable()
    table.string('postal_code').nullable()
    table.string('address_type').nullable()
    table
      .uuid('user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .nullable()
    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('addresses')
}
