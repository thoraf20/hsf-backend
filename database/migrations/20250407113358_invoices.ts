import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("invoices", (table) => {
    table.uuid("invoice_id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.decimal('tax', 12, 2)
    table
    .uuid('payment_id')
    .notNullable()
    .references('payment_id')
    .inTable('payments')
    .onDelete('CASCADE')
    .onUpdate('CASCADE')
    table.timestamps(true, true);
})
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("invoices");
}

