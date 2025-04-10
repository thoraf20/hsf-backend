import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('prequalify_status', (table) => {
    table.dropColumn('status');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('prequalify_status', (table) => {
    table.boolean('status').notNullable().defaultTo(false);
  });
}
