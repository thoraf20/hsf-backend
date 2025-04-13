import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('shares', (table) => {
         table.uuid('share_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
         table.string('recipient_email').notNullable()
         table.string('sender_email').notNullable()
         table.text('message')
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
    return knex.schema.dropTable('shares');
}
