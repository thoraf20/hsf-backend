import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('prequalify_property_information', (table) => {
        table.uuid('property_information_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('preferred_developer').notNullable();
        table.string('property_name').notNullable();
        table.string('preferred_lender').notNullable();
        table.timestamps(true, true);
        table.uuid('personal_information_id')
            .notNullable()
            .references('personal_information_id')
            .inTable('prequalify_personal_information')
            .onDelete('CASCADE')
            .onUpdate('CASCADE');
        table.uuid('property_id')
            .notNullable()
            .references('id')
            .inTable('properties')
            .onDelete('CASCADE')
            .onUpdate('CASCADE');
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('prequalify_property_information');
}
