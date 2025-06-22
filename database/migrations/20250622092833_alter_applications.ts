import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('application', (table) => {
    table
      .uuid('current_loan_officer_assignment_id')
      .references('id')
      .inTable('user_assignments')
      .onDelete('SET NULL')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('application', (table) => {
    table.dropColumn('current_loan_officer_assignment_id')
  })
}
