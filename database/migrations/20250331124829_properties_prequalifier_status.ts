import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('prequalify_status', (table) => {
        table.uuid('status_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.enu('status', ['Pending', 'Declined', 'Approved']).notNullable().defaultTo('Pending');
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
        table.uuid('loaner_id')
            .notNullable()
            .references('id')
            .inTable('users')
            .onDelete('CASCADE')
            .onUpdate('CASCADE');
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('prequalify_status');
}
