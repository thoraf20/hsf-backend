import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('user_activity_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')

    table
      .uuid('organization_id')
      .nullable()
      .references('id')
      .inTable('organizations')
      .onDelete('SET NULL')

    table.string('activity_type', 255).notNullable()
    table.text('description')
    table.timestamp('performed_at', { useTz: true }).defaultTo(knex.fn.now())
    table.string('ip_address', 50)
    table.string('user_agent', 255)
    table.jsonb('metadata')

    table.index('user_id')
    table.index('performed_at')
    table.index('activity_type')
    table.timestamps(true)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('user_activity_logs')
}
