import type { Knex } from "knex";

const tablename = 'enquires_message'

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable(tablename, (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
        table
          .uuid('enquiry_id')
          .notNullable()
          .references('id')
          .inTable('enquires')
          .onDelete('CASCADE')
        table
          .uuid('owner_id')
          .notNullable()
          .references('id')
          .inTable('users')
          .onDelete('CASCADE')
        table.string("message").notNullable()
        table.timestamps(true, true)
      })
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable(tablename)
}

