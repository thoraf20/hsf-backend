import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('user_organization_memberships', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
    table
      .uuid('organization_id')
      .notNullable()
      .references('id')
      .inTable('organizations')
      .onDelete('CASCADE')
    table
      .uuid('role_id')
      .notNullable()
      .references('id')
      .inTable('roles')
      .onDelete('CASCADE') // The role the user has *within* this organization
    table.timestamps(true, true)

    table.unique(['user_id', 'organization_id', 'role_id'], {
      indexName: 'idx_user_org_role_unique',
    })
    // If a user can only have one role per organization, then:
    // table.unique(["user_id", "organization_id"], { indexName: 'idx_user_org_unique' });

    table.index(['user_id'], 'idx_user_organization_memberships_user_id')
    table.index(
      ['organization_id'],
      'idx_user_organization_memberships_organization_id',
    )
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('user_organization_memberships')
}
