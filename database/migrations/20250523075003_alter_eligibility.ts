import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('eligibility', (table) => {
    table
      .uuid('prequalifier_input_id')
      .references('id')
      .inTable('prequalification_inputs')
      .onDelete('CASCADE')
      .onUpdate('CASCADE')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('eligibility', (table) => {
    table.dropColumn('prequalifier_input_id')
  })
}
