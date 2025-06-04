import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  const tableExist = await knex.schema.hasTable('loan_offer')
  if (tableExist) {
    await knex.schema.alterTable('application', (table) => {
      table.dropColumn('loan_offer_id')
    })
    await knex.schema.dropTable('loan_offer')
  }

  return knex.schema.createTable('loan_offers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))

    table
      .uuid('application_id')
      .references('application_id')
      .inTable('application')
      .onDelete('SET NULL')
      .onUpdate('CASCADE')
      .nullable()

    table
      .uuid('organization_id')
      .references('id')
      .inTable('organizations')
      .nullable()
      .onDelete('SET NULL')
      .onUpdate('CASCADE')

    table
      .uuid('user_id')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
      .onUpdate('CASCADE')
      .nullable()

    table
      .uuid('lender_org_id')
      .references('id')
      .inTable('organizations')
      .onDelete('SET NULL')
      .onUpdate('CASCADE')

    table.decimal('loan_amount', 12, 2).notNullable()
    table.decimal('interest_rate', 6, 2).notNullable()
    table.integer('loan_term_months').notNullable()
    table.string('repayment_frequency').notNullable()

    table.string('offer_status').notNullable()
    table.timestamp('offer_date').notNullable()
    table.timestamp('expiry_date').notNullable()

    table.decimal('total_interest_estimate').nullable()
    table.decimal('total_payable_estimate').nullable()
    table.decimal('estimated_periodic_payment').nullable()

    table.text('late_payment_penalty_details').nullable()
    table.text('financing_details').nullable()
    table.text('repayment_method_details').nullable()
    table.jsonb('lender_comments').nullable()

    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('loan_offer')
}
