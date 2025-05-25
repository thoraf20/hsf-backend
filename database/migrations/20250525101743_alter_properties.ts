import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('properties', (table) => {
    table.decimal('down_payment_percentage', 3, 2).nullable()
    table.integer('unit_numbers').nullable()
    table.setNullable('payment_duration')
    table
      .uuid('listed_by_id')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
      .onUpdate('CASCADE')
      .nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('properties', (table) => {
    table.dropColumn('down_payment_percentage')
    table.dropColumn('listed_by_id')
    table.dropColumn('unit_numbers')
    table.dropNullable('payment_duration')
  })
}
