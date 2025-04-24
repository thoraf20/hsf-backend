import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('inspection', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))

    table.date('inspection_date').notNullable()
    table.time('inspection_time').notNullable()

    table.string('full_name').notNullable()
    table.string('email').notNullable()
    table.string('contact_number').notNullable()

    table
      .string('meeting_platform')
      .checkIn(['WhatsApp', 'Google Meet', 'Zoom', 'Teams', 'FaceTime'])
    // table.string('inspection_meeting_type').checkIn(['In Person', 'Video Chat']).notNullable();

    table.boolean('inspection_fee_paid').defaultTo(false)
    table.string('meet_link')
    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .onUpdate('CASCADE')
    table
      .uuid('property_id')
      .notNullable()
      .references('id')
      .inTable('properties')
      .onDelete('CASCADE')
      .onUpdate('CASCADE')
    table.index(['inspection_date', 'user_id'], 'idx_inspection_date_user')
    table.index(['property_id'], 'idx_inspection_property')

    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('inspection')
}
