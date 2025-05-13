import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // First, check if the column 'developers_profile_id' exists as it's unusually named for a FK to users
  // If it was meant to be 'user_id', adjust the drop column name accordingly.
  // For this example, I'm assuming 'developers_profile_id' is the column to be replaced.

  await knex.schema.alterTable('developers_profile', (table) => {
    // Drop the old foreign key that references users table if it exists and is named 'developers_profile_id'
    // You might need to drop the constraint explicitly first if it was named.
    // table.dropForeign(['developers_profile_id']); // Knex might need specific constraint name
    table.dropColumn('developers_profile_id')
  })

  await knex.schema.alterTable('developers_profile', (table) => {
    table
      .uuid('organization_id')
      .notNullable()
      .references('id')
      .inTable('organizations')
      .onDelete('CASCADE')
      .unique() // Assuming one profile per developer organization
    table.index('organization_id')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('developers_profile', (table) => {
    table.dropColumn('organization_id')
  })

  // Add back the old column structure if needed for rollback
  // This depends on its original exact definition
  await knex.schema.alterTable('developers_profile', (table) => {
    table.uuid('developers_profile_id').notNullable()
    //  .references('id') // Re-add reference if it was there
    //  .inTable('users')   // Re-add reference if it was there
    // Add other constraints as they were
  })
}
