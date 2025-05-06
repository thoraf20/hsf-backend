import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('escrow_information', (table) => {
    table.dropColumn('user_id')
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('escrow_information', (table) => {
    table.string('user_id')
  });
}
