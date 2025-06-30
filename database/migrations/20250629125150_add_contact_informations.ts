import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('contact_informations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table
      .uuid('user_id')
      .notNullable()
      .unique()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')

    // Personal Contact Information
    table.string('email', 255).notNullable()
    table.string('country_code', 10).notNullable()
    table.string('contact_number', 20).notNullable()

    // Emergency Contact Information
    table.string('emergency_name', 255).notNullable()
    table.string('emergency_relationship', 100).notNullable()
    table.string('emergency_contact', 20).notNullable()
    table.text('emergency_address').notNullable()

    // Indexes
    table.index(['email'], 'idx_contact_email')
    table.index(['emergency_contact'], 'idx_emergency_contact')
    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('contact_informations')
}
