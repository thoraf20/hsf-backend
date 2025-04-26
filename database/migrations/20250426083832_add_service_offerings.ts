import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('service_offerings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.string('service_name').notNullable()
    table.string('description')
    table.decimal('base_price').notNullable()
    table.string('image_url')
    table
      .uuid('created_by_id')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
      .onUpdate('CASCADE')

    table
      .uuid('deleted_by_id')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
      .onUpdate('CASCADE')

    table.timestamp('deleted_at')
    table.string('product_code').notNullable().unique()
    table.string('currency').notNullable()
    table.jsonb('metadata')

    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('service_offerings')
}
