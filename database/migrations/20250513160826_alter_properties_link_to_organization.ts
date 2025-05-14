import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('properties', (table) => {
    // Drop the existing foreign key constraint and column referencing users
    // Knex usually handles dropping the default-named foreign key when dropping the column.
    // If there was a custom constraint name, you might need to drop it explicitly first, e.g.:
    // table.dropForeign('user_id'); // Example if the constraint was named 'user_id'
    // table.dropForeign('properties_user_id_foreign'); // Example if Knex auto-named it
    table.dropColumn('user_id')

    // Add the new foreign key constraint referencing organizations
    table
      .uuid('organization_id')
      .notNullable()
      .references('id')
      .inTable('organizations')
      .onDelete('CASCADE')

    // Add an index on the new column for performance
    table.index('organization_id')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('properties', (table) => {
    // Drop the foreign key constraint and column referencing organizations
    // Similar assumption about dropping the column also dropping the constraint
    // table.dropForeign('organization_id'); // Example if the constraint was named 'organization_id'
    // table.dropForeign('properties_organization_id_foreign'); // Example if Knex auto-named it
    table.dropColumn('organization_id')

    // Add the old foreign key constraint and column referencing users back
    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')

    // Add the old index back
    table.index('user_id')
  })
}
