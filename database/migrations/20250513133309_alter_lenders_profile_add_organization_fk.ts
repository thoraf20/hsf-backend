import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('lenders_profile', (table) => {
    // Drop the old foreign key that references users table
    table.dropColumn('user_id')
  })

  await knex.schema.alterTable('lenders_profile', (table) => {
    table
      .uuid('organization_id')
      .notNullable()
      .references('id')
      .inTable('organizations')
      .onDelete('CASCADE')
      .unique() // Assuming one profile per lender organization
    table.index('organization_id')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('lenders_profile', (table) => {
    table.dropColumn('organization_id')
  })

  // Add back the old user_id column
  await knex.schema.alterTable('lenders_profile', (table) => {
    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
    // Re-add index if there was one
  })
}
