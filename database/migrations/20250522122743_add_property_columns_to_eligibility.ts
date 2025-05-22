import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('eligibility', (table) => {
    // Add foreign key for developer
    table
      .uuid('developer_id')
      .notNullable()
      .references('profile_id')
      .inTable('developers_profile')
      .onDelete('CASCADE')
      .onUpdate('CASCADE')

    // Add foreign key for lender
    table
      .uuid('lender_id')
      .notNullable()
      .references('id')
      .inTable('lenders_profile')
      .onDelete('CASCADE')
      .onUpdate('CASCADE')

    // Add rsa column
    table.string('rsa').notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('eligibility', (table) => {
    // Drop the added columns
    table.dropColumn('rsa')
    table.dropColumn('lender_id')
    table.dropColumn('developer_id')
  })
}
