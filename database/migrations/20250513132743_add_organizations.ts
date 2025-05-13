import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('organizations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.string('name').notNullable()
    table.string('type').notNullable()

    table
      .uuid('owner_user_id')
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')

    table.index(['type'], 'idx_organizations_type')
    table.unique(['name', 'type'])
    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('organizations')
}
