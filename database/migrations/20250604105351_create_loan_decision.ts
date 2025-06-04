import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('loan_decisions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table
      .uuid('application_id')
      .references('application_id')
      .inTable('application')
      .notNullable()

    table
      .uuid('user_id')
      .references('id')
      .inTable('users')
      .notNullable()
      .onDelete('CASCADE')
      .onUpdate('CASCADE')

    table.timestamp('brokerage_fee_paid_at', { useTz: true })
    table.uuid('brokerage_fee_payment_id')
    table
      .uuid('loan_offer_id')
      .references('id')
      .inTable('loan_offers')
      .notNullable()

    table
      .uuid('lender_org_id')
      .notNullable()
      .references('id')
      .inTable('organizations')

    table.text('status').notNullable()

    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('loan_decision')
}
