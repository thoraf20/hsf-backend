import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("property_details", (table) => {
    table.boolean("is_live").defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("property_details", (table) => {
    table.dropColumn("is_iive");
  });
}