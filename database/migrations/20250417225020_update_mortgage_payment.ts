import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('application', (table) => {
    table
    .uuid('mortage_payment_status_id') 
    .references('mortage_payment_status_id')
    .inTable('mortage_payment_status')
    .onDelete('CASCADE')
    .onUpdate('CASCADE')
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('application', (table) => {
    table.dropColumn('mortage_payment_status_id')
  });
}
