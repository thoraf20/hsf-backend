import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('prequalify_personal_information', (table) => {
        table.uuid('personal_information_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('first_name').notNullable();
        table.string('last_name').notNullable();
        table.string('email').unique().notNullable();
        table.string('phone_number').unique().notNullable();
        table.enu('gender', ['Male', 'Female']).notNullable();
        table.enu('marital_status', ['Married', 'Single', 'Widowed', 'Divorced']).notNullable();
        table.string('house_number').notNullable();
        table.string('street_address').notNullable();
        table.string('state').notNullable();
        table.string('city').notNullable();
        table.timestamps(true, true);
        table.uuid('loaner_id')
            .notNullable()
            .references('id')
            .inTable('users')
            .onDelete('CASCADE')
            .onUpdate('CASCADE');
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('prequalify_personal_information');
}
