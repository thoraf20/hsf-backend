import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('application', (table) => {
    table
    .uuid('dip_id') 
    .references('dip_id')
    .inTable('dip')
    .onDelete('CASCADE')
    .onUpdate('CASCADE')
    table
    .uuid('document_upload_id') 
    .references('document_upload_id')
    .inTable('document_upload')
    .onDelete('CASCADE')
    .onUpdate('CASCADE')
    table
    .uuid('loan_offer_id') 
    .references('loan_offer_id')
    .inTable('loan_offer')
    .onDelete('CASCADE')
    .onUpdate('CASCADE')
    table
    .uuid('payment_date_id') 
    .references('payment_date_id')
    .inTable('replayment_plan')
    .onDelete('CASCADE')
    .onUpdate('CASCADE')
    table
    .uuid('precedent_document_upload_id') 
    .references('precedent_document_upload_id')
    .inTable('precedent_document_upload')
    .onDelete('CASCADE')
    .onUpdate('CASCADE')
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('application', (table) => {
    table.dropColumn('dip_id')
    table.dropColumn('document_upload_id')
    table.dropColumn('loan_offer_id')
    table.dropColumn('payment_date_id')
    table.dropColumn('precedent_document_upload_id')
  });
}
