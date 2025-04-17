import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('application', (table) => {
    table
    .uuid('offer_letter_id') 
    .references('offer_letter_id')
    .inTable('offer_letter')
    .onDelete('CASCADE')
    .onUpdate('CASCADE')
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('application', (table) => {
    table.dropColumn('offer_letter_id')
  });
}
