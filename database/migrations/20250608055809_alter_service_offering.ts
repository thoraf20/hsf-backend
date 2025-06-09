import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('service_offerings', (table) => {
    table.decimal('percentage', 6, 2).nullable()
    table.setNullable('base_price')
    table.setNullable('image_url')
    table.string('compute_type').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('service_offerings', (table) => {
    table.dropColumn('percentage')
    table.dropColumn('compute_type')
    table.dropNullable('base_price')
    table.dropNullable('image_url')
  })
}
