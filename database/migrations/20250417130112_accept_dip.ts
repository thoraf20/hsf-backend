import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('dip', (table) => {
         table.uuid('dip_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
         table.string('dip_status').defaultTo('pending');
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
    return knex.schema.dropTable('dip');
}
