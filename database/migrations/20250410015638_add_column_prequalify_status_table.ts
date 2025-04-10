import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('prequalify_status', (table) => {
    table.boolean('is_prequalify_requested').notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('prequalify_status', (table) => {
    table.dropColumn('is_prequalify_requested');
  });
}
