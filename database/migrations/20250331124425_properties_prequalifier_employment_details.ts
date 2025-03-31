import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('prequalify_employment_information', (table) => {
        table.uuid('employment_information_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.enu('employment_confirmation', ['Yes', 'No']).notNullable();
        table.string('employment_position').notNullable();
        table.bigint('years_to_retirement').notNullable();
        table.string('employer_address').notNullable();
        table.string('employer_state').notNullable();
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
    return knex.schema.dropTable('prequalify_employment_information');
}
