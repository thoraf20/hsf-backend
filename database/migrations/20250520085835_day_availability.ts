import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('day_availability', (table) => {
            table
      .uuid('day_availability_id')
      .primary()
      .defaultTo(knex.raw('gen_random_uuid()'))
      table.string('time_slot').notNullable()
          table
      .uuid('organization_id')
      .notNullable()
      .references('id')
      .inTable('organizations')
      .onDelete('CASCADE')
       table.unique(['organization_id', 'time_slot']);
      table.timestamps(true, true);
    })
    
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('day_availability')
}

