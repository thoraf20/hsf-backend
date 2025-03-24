import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('inspection', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.enum('purchase_plan_type', ['Mortgage', 'Outright Purchase', 'Installment']).notNullable();

    table.date('inspection_date').notNullable();
    table.time('inspection_time').notNullable();

    table.string('full_name').notNullable();
    table.string('email').notNullable();
    table.string('contact_number').notNullable();

    table.enum('meeting_platform', ['WhatsApp', 'Google Meet', 'Zoom', 'Teams', 'FaceTime'])
    table.enum('inspection_meeting_type', ['In Person', 'Video Chat']).notNullable();

    table.boolean('inspection_fee_paid').defaultTo(false);
    table.string('meet_link')
    table.uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');

    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('inspection');
}
