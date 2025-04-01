import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('prequalify_financial_information', (table) => {
        table.uuid('financial_information_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.decimal('net_income', 12, 2).notNullable();
        table.string('industry_type');
        table.string('employment_type');
        table.enu('existing_loan_obligation', ['Yes', 'No']);
        table.string('rsa').notNullable();
        table.timestamps(true, true);
        table.uuid('employment_information_id')
            .notNullable()
            .references('employment_information_id')
            .inTable('prequalify_employment_information')
            .onDelete('CASCADE')
            .onUpdate('CASCADE');
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('prequalify_financial_information');
}
