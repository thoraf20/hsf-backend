import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('login_attempts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table
      .uuid('user_id')
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
    table.timestamp('attempted_at', { useTz: true }).defaultTo(knex.fn.now())
    table.boolean('successful').notNullable()
    table.string('ip_address', 50)
    table.string('user_agent', 255)

    table.index('user_id')
    table.index('attempted_at')
    table.index('successful')
    table.timestamps(true)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('login_attempts')
}
