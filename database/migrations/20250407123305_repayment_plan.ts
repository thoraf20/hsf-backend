import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("replayment_plan", (table) => {
    table.uuid("payment_date_id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string('precedent_date').notNullable();
    table.string('amount_due').notNullable()
    table.string('payment_status').notNullable().defaultTo('Pending');
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
    return knex.schema.dropTable("replayment_plan");
}

