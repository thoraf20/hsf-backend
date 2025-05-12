import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('recovery_codes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.text('code').notNullable()
    table
      .uuid('user_id')
      .references('id')
      .inTable('users')
      .notNullable()
      .onDelete('CASCADE')

    table.boolean('used').notNullable()
    table.timestamps(true, true)
  })

  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('recovery_codes')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('recovery_codes')
}
