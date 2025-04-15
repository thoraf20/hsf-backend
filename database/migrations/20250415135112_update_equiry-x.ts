import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('enquires_message', (table) => {
    table.string('email').notNullable();
    table.string('phone').notNullable();
    table.string('full_name').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('enquires_message', (table) => {
    table.dropColumn('email')
    table.dropColumn('phone')
    table.dropColumn('full_name')
  });
}
