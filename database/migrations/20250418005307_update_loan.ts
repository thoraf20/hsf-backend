import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('loan_offer', (table) => {
    table.string('loan_acceptance_status').defaultTo('pending')
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('loan_offer', (table) => {
    table.dropColumn('loan_acceptance_status')
  });
}
