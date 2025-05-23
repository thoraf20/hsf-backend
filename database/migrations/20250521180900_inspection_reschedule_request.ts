import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.dropTable('inspection_reschedule_requests')
}

export async function down(knex: Knex): Promise<void> {}
