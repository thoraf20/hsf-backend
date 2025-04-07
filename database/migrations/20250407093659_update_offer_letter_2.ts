import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable("offer_letter", (table) => {
        table.string('purchase_type').notNullable().defaultTo("");
    });
}
 

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable("offer_letter", (table) => {
        table.dropColumn("purchase_type");
    });
}