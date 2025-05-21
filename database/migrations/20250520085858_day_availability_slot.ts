import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('day_availability_slot', (table) => {
            table
      .uuid('day_availability_slot_id')
      .primary()
      .defaultTo(knex.raw('gen_random_uuid()'))
      table.string('day').notNullable()
      table.timestamp('start_time').notNullable()
      table.timestamp('end_time').notNullable()
      table.boolean('is_available').notNullable().defaultTo(true)
          table
      .uuid('day_availability_id')
      .notNullable()
      .references('day_availability_id')
      .inTable('day_availability')
      .onDelete('CASCADE')
        table.unique(['day_availability_id', 'day']);
      table.timestamps(true, true);
    })
    
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('day_availability_slot')
}

