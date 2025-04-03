import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('prequalify_other_info', (table) => {
        table.uuid('information_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.enu('employment_confirmation', ['Yes', 'No']).notNullable();
        table.string('employment_position').notNullable();
        table.bigint('years_to_retirement').notNullable();
        table.string('employer_address').notNullable();
        table.string('employer_state').notNullable();
        table.decimal('net_income', 12, 2).notNullable();
        table.string('industry_type');
        table.string('employment_type');
        table.enu('existing_loan_obligation', ['Yes', 'No']);
        table.string('preferred_developer').notNullable();
        table.string('property_name').notNullable();
        table.string('preferred_lender').notNullable();
        table.string('rsa').notNullable();
        table.timestamps(true, true);
        table.uuid('property_id')
            .notNullable()
            .references('id')
            .inTable('properties')
            .onDelete('CASCADE')
            .onUpdate('CASCADE');
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('prequalify_other_info');
}
