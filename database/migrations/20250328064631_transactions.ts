import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable("properties", (table) => {
        table.string("status").defaultTo("Pending");
    });

    await knex.raw(`
        ALTER TABLE properties ADD CONSTRAINT status_check 
        CHECK (status IN ('Approved', 'Declined', 'Pending'));
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable("properties", (table) => {
        table.dropColumn("status");
    });
}
