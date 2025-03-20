import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("property_details", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.string('property_name').notNullable();
        table.string('property_type').notNullable();
        table.string('property_size').notNullable();
        table.string('property_price').notNullable();
        table.string('property_description').notNullable();
        table.integer('numbers_of_bedroom').notNullable();
        table.integer('numbers_of_bathroom').notNullable();
        table.string('property_condition').notNullable();
        table.specificType('financial_options', 'text ARRAY').notNullable();
        table.specificType('property_feature', 'text ARRAY').notNullable();
        table.specificType('property_images', 'text ARRAY').notNullable();
        table.uuid("property_address_id").references("id").inTable("property_address").onDelete("CASCADE");
        table.index(["property_name", "property_type"], "idx_property_name_type");
        table.index(["property_price"], "idx_property_price");
        table.boolean('is_sold').defaultTo(false);
        table.timestamps(true, true);
    })
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("property_details");
}

