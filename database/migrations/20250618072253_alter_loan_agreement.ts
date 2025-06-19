import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('loan_agreements', (table) => {
    table
      .uuid('lender_signature')
      .references('id')
      .inTable('application_document_entries')
      .onDelete('SET NULL')
      .alter()

    table
      .uuid('borrower_signature')
      .references('id')
      .inTable('application_document_entries')
      .onDelete('SET NULL')
      .alter()

    table.renameColumn('lender_signature', 'lender_signature_doc_id')
    table.renameColumn('borrower_signature', 'borrower_signature_doc_id')

    table.setNullable('application_id')
  })
}
export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('loan_agreements', (table) => {
    table.dropForeign(['lender_signature_doc_id'])
    table.dropForeign(['borrower_signature_doc_id'])

    table.text('lender_signature_doc_id').alter()
    table.text('borrower_signature_doc_id').alter()

    table.renameColumn('lender_signature_doc_id', 'lender_signature')
    table.renameColumn('borrower_signature_doc_id', 'borrower_signature')
  })
}
