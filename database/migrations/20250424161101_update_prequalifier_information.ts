import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('prequalify_personal_information', (table) => {
    table.dropUnique(['email'])
    table.dropUnique(['phone_number'])
  })
}

export async function down(knex: Knex): Promise<void> {}
