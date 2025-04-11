import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('eligibility', (table) => {
    table.string('financial_eligibility_type');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('eligibility', (table) => {
    table.dropColumn('financial_eligibility_type');
  });
}
