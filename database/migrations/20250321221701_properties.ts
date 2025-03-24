import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("properties", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.string('street_address').notNullable();
        table.string("state").notNullable();
        table.string('city').notNullable();
        table.string('unit_number').notNullable();
        table.string('postal_code').notNullable();
        table.string('landmark').notNullable();
        table.string('property_name').notNullable();
        table.string('property_type').notNullable();
        table.string('property_size').notNullable();
        table.string('property_price').notNullable();
        table.string('property_description').notNullable();
        table.integer('numbers_of_bedroom').notNullable();
        table.integer('numbers_of_bathroom').notNullable();
        table.string('property_condition').notNullable();
        table.specificType('financial_types', 'text ARRAY').notNullable();
        table.specificType('property_feature', 'text ARRAY').notNullable();
        table.specificType('property_images', 'text ARRAY').notNullable();
        table.index(["property_name", "property_type"], "idx_property_name_type");
        table.index(["property_price"], "idx_property_price");
        table.string("payment_duration").notNullable();
        table.jsonb('documents');
        table.timestamp('deleted_at').nullable();
        table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
        table.boolean('is_sold').defaultTo(false);
        table.boolean("is_live").defaultTo(false);
    })
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("properties");
}

