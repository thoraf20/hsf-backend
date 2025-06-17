import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('loan_agreements', (table) => {
    table.uuid('id').defaultTo(knex.raw('gen_random_uuid()')).primary()
    table.uuid('loan_id').nullable()
    table.uuid('loan_offer_id').notNullable()
    table.timestamp('agreement_date', { useTz: true }).nullable()
    table.string('status').notNullable()
    table.string('borrower_signature').nullable()
    table.string('lender_signature').nullable()
    table.uuid('application_id').nullable()
    table.uuid('lender_org_id').notNullable()
    table.uuid('user_id').notNullable()
    table.timestamp('lender_sign_uploaded_at').nullable()
    table.timestamp('borower_sign_uploaded_at').nullable()

    table.foreign('loan_id').references('id').inTable('loans')

    table
      .foreign('loan_offer_id')
      .references('id')
      .inTable('loan_offers')
      .onDelete('CASCADE')

    table
      .foreign('application_id')
      .references('application_id')
      .inTable('application')

    table
      .foreign('lender_org_id')
      .references('id')
      .inTable('organizations')
      .onDelete('SET NULL')

    table
      .foreign('user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')

    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('loan_agreements')
}
