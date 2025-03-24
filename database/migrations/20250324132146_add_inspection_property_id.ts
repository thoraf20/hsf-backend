import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("inspection", (table) => {
    table
      .uuid('property_id')
      .notNullable()
      .references('id')
      .inTable('properties')
      .onDelete('CASCADE')
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("inspection", (table) => {
    table.uuid('property_id')
  });
}