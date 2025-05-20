import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("inspection_reschedule_requests", (table) => {
    table
      .uuid("inspection_reschedule_id")
      .primary()
      .defaultTo(knex.raw("gen_random_uuid()"));
    table.string("original_slot_id").notNullable();
    table.string("proposed_slot_id").notNullable();
    table.string("status").notNullable().defaultTo("pending");
    table.string("user_rejection_reason");

    table
      .uuid("inspection_id")
      .notNullable()
      .references("id")
      .inTable("inspection")
      .onDelete("SET NULL")
      .onUpdate("CASCADE");

    table
      .uuid("proposed_by_user_id")
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("SET NULL")
        .onUpdate("CASCADE");
    table.index("inspection_id");
    table.timestamps(true, true); 
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("inspection_reschedule_requests");
}
