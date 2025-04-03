import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable("transactions", (table) => {
        table.uuid('property_id')
        .references('id')
        .inTable('properties')
        .onDelete('CASCADE')
        .onUpdate('CASCADE');
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable("transactions", (table) => {
        table.dropColumn("property_id");
    });
}

