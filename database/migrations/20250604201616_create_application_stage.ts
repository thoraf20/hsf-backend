import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('application_stages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table
      .uuid('application_id')
      .notNullable()
      .references('application_id')
      .inTable('application')
      .onDelete('CASCADE')

    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')

    table.string('stage').notNullable()
    table.timestamp('entry_time', { useTz: true }).notNullable()
    table.timestamp('exit_time', { useTz: true })
    table.jsonb('additional_info')

    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('application_stages')
}
