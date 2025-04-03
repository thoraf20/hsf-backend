import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('prequalify_payment_calculator', (table) => {
        table.uuid('payment_calculator_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('house_price').notNullable()
        table.string('interest_rate').notNullable()
        table.string('terms').notNullable()
        table.string('repayment_type').notNullable()
        table.string('est_money_payment').notNullable()
        table.timestamps(true, true);
            table.uuid('personal_information_id')
            .notNullable()
            .references('personal_information_id')
            .inTable('prequalify_personal_information')
            .onDelete('CASCADE')
            .onUpdate('CASCADE');
    });
    
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('prequalify_payment_calculator');
}
