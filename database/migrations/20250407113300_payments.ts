import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("payments", (table) => {
    table.uuid("payment_id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("payment_type").notNullable();
    table.string("payment_status").notNullable();
    table.decimal('amount', 12, 2).notNullable();
    table.string('transaction_id').notNullable();
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
    table.timestamps(true, true);
})
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("payments");
}

