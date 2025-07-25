import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('enquires', (table) => {
    table.dropColumn('customer_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('enquires', (table) => {
    table.string('customer_id').notNullable().defaultTo(false);
  });
}
