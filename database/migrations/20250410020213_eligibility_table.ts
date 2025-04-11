import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('eligibility', (table) => {
         table.uuid('eligibility_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
         table.string('eligiblity_status').notNullable().defaultTo("Pending")
         table.boolean('is_eligible').notNullable().defaultTo(false)
         table.timestamps(true, true);
         table.uuid('prequalify_status_id')
         .notNullable()
         .references('status_id')
         .inTable('prequalify_status')
         .onDelete('CASCADE')
         .onUpdate('CASCADE');
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
    return knex.schema.dropTable('eligibility');
}

