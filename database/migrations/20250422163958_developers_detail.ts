import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('developers_profile', (table) => {
    table.uuid('profile_id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.string('company_name').notNullable().unique()
    table.string('company_registration_number').notNullable().unique()
    table.string('office_address').notNullable()
    table.string('company_email').notNullable().unique()
    table.string('state').notNullable()
    table.string('city').notNullable()
    table.string('developer_role').notNullable()
    table.string('years_in_business').notNullable()
    table.string('specialization').notNullable()
    table.string('region_of_operation').notNullable()
    table.string('company_image').notNullable()
    table.jsonb('documents').notNullable()
    table.timestamps(true, true)
    table
      .uuid('developers_profile_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .onUpdate('CASCADE')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('developers_profile')
}
