import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('dip', (table) => {
    table
      .uuid('application_id')
      .references('application_id')
      .inTable('application')
      .onDelete('CASCADE')
      .onUpdate('CASCADE')

    // Add eligibility_id
    table.uuid('eligibility_id') // Assuming UUID, adjust if necessary

    // Add loan details
    table.decimal('approved_loan_amount', 12, 2)
    table.decimal('interest_rate', 5, 2)
    table.string('loan_term')
    table.decimal('monthly_payment', 12, 2)

    table.timestamp('generated_at').defaultTo(knex.fn.now())
    table.string('user_action')
    table.timestamp('user_action_at')

    table.string('payment_status').defaultTo('pending') // e.g., 'pending', 'paid', 'failed'
    table.string('payment_transaction_id')

    table.string('documents_status').defaultTo('not_uploaded') // e.g., 'not_uploaded', 'uploaded', 'under_review'
    table
      .uuid('documents_review_request_id')
      .references('id')
      .inTable('review_requests')
      .onDelete('SET NULL')
      .onUpdate('CASCADE')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('dip', (table) => {
    // Drop columns in reverse order of addition
    table.dropColumn('documents_review_request_id')
    table.dropColumn('documents_status')
    table.dropColumn('payment_transaction_id')
    table.dropColumn('payment_status')
    table.dropColumn('user_action_at')
    table.dropColumn('user_action')
    table.dropColumn('generated_at')
    table.dropColumn('monthly_payment')
    table.dropColumn('loan_term')
    table.dropColumn('interest_rate')
    table.dropColumn('approved_loan_amount')
    table.dropColumn('eligibility_id')
    table.dropColumn('application_id')
  })
}
