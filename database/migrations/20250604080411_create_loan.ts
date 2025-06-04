import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('loans', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table
      .uuid('loan_offer_id')
      .references('id')
      .inTable('loan_offers')
      .notNullable()
      .onDelete('CASCADE')
      .onUpdate('CASCADE')

    table
      .uuid('application_id')
      .nullable()
      .references('application_id')
      .inTable('application')
      .onDelete('SET NULL')
      .onUpdate('CASCADE')

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

    table.decimal('principal_amount', 12, 2).notNullable()
    table.decimal('interest_rate', 6, 2).notNullable()
    table.integer('loan_terms_months').notNullable()
    table.string('repayment_frequency').notNullable()

    table.string('loan_status').notNullable()
    table.timestamp('start_date', { useTz: true }).notNullable()
    table.timestamp('end_date', { useTz: true }).notNullable()

    table.decimal('remaning_balance', 12, 2).notNullable()
    table.decimal('total_interest_paid', 12, 2).notNullable()
    table.decimal('total_principal_paid', 12, 2).notNullable()

    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('loans')
}
