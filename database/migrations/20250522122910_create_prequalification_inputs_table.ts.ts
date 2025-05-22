import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('prequalification_inputs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))

    table.string('first_name').notNullable()
    table.string('last_name').notNullable()
    table.string('email').notNullable()
    table.string('phone_number').notNullable()
    table.text('gender').notNullable()
    table.text('marital_status').notNullable()
    table.string('house_number').notNullable()
    table.string('street_address').notNullable()
    table.string('state').notNullable()
    table.string('city').notNullable()
    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .onUpdate('CASCADE')

    // Columns from prequalify_other_info
    table.text('employment_confirmation').notNullable()
    table.string('employment_position').notNullable()
    table.bigint('years_to_retirement').notNullable()
    table.string('employer_address').notNullable()
    table.string('employer_state').notNullable()
    table.decimal('net_income', 12, 2).notNullable()
    table.string('industry_type').nullable()
    table.string('employment_type').nullable()
    table.text('existing_loan_obligation').nullable()
    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('prequalification_inputs')
}
