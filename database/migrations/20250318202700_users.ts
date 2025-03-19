import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("users", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.string("first_name").notNullable();
        table.string("last_name").notNullable();
        table.string("email").unique().notNullable();
        table.string("phone_number").unique().notNullable();
        table.text("profile");
        table.enum("role", ["user", "admin"]).defaultTo("user");
        table.string("password").notNullable();
        table.string("image").nullable();
        table.text("user_agent").nullable();
        table.integer("failed_login_attempts").defaultTo(0);
        table.boolean("is_email_verified").defaultTo(false);
        table.boolean("is_phone_verified").defaultTo(false);
        table.integer("role_id").unsigned().references("id").inTable("roles").onDelete("CASCADE");
        table.timestamps(true, true);
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("users");
}
