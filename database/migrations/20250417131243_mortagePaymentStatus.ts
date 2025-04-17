import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('mortage_payment_status', (table) => {
         table.uuid('mortage_payment_status_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
         table.boolean('pay_due_deligence').defaultTo(false);
         table.boolean('pay_brokage_fee').defaultTo(false);
         table.boolean('pay_management_fee').defaultTo(false);
         table.timestamps(true, true);
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

    })
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('mortage_payment_status');
}
