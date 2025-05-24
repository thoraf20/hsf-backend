import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('prequalify_payment_calculator', (table) => {
    table.dropColumn('house_price')
    table.dropColumn('personal_information_id')
    table.dropColumn('est_money_payment')

    table
      .uuid('application_id')
      .references('application_id')
      .inTable('application')
      .onDelete('CASCADE')
      .onUpdate('CASCADE')
      .notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {}
