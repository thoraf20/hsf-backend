import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("loan_offer", (table) => {
    table.uuid("loan_offer_id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string('property_name').notNullable();
    table.string('property_location').notNullable();
    table.decimal('loan_amount', 12, 2).notNullable().defaultTo(0);
    table.decimal('interest_rate', 5, 2).notNullable().defaultTo(0);
    table.string('payment_duration').notNullable();
    table.string('total_interest_over_loan_period').notNullable();
    table.string('late_payment_penalty').notNullable();
    table.string('financing').notNullable();
    table.string('repayment_menthod').notNullable();
    table.string('total_payable_amount').notNullable();
    table.boolean('accepted').notNullable().defaultTo(false);
    table
    .uuid('property_id')
    .notNullable()
    .references('id')
    .inTable('properties')
    .onDelete('CASCADE')
    .onUpdate('CASCADE')
    table.uuid('user_id')
    .notNullable()
    .references('id')
    .inTable('users')
    .onDelete('CASCADE')
    .onUpdate('CASCADE');
    table.timestamps(true, true);
})
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("loan_offer");
}

