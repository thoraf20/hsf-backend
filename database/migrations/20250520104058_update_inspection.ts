import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('inspection', (table) => {
    table.string('action').notNullable().defaultTo("scheduled")
    table.string('confirm_avaliability_for_reschedule').defaultTo(null)
          table
      .uuid('day_availability_slot_id')
      .notNullable()
      .references('day_availability_slot_id')
      .inTable('day_availability_slot')
      .onDelete('CASCADE')
     
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('inspection', (table) => {
    table.dropColumn('action')
    table.dropColumn('day_availability_slot_id')
  })
}
