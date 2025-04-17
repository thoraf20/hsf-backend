import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('application', (table) => {
    table
      .uuid('eligibility_id')
      .notNullable()
      .references('eligibility_id')
      .inTable('eligibility')
      .onDelete('CASCADE')
      .onUpdate('CASCADE')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('application', (table) => {
    table.dropColumn('eligibility_id')
  })
}
