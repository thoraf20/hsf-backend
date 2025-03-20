import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("property_address", (table) => {
    table.string("state").notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("property_address", (table) => {
    table.dropColumn("state");
  });
}
