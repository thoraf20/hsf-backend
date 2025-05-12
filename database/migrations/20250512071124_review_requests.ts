import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('review_request_types', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.text('type').notNullable().unique().index()
    table.timestamps(true, true)
  })

  await knex.schema.createTable('review_requests', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table
      .uuid('request_type_id')
      .notNullable()
      .references('id')
      .inTable('review_request_types')
      .onDelete('CASCADE')

    table
      .uuid('initiator_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')

    table.text('candidate_name').notNullable()
    table.timestamp('submission_date').notNullable()
    table.text('status').notNullable()
    table.timestamps(true, true)
  })

  await knex.schema.createTable('review_request_stages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.text('name').notNullable().unique().index()

    table.text('description')
    table.timestamps(true, true)
  })

  await knex.schema.createTable('review_request_type_stages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table
      .uuid('stage_id')
      .notNullable()
      .references('id')
      .inTable('review_request_stages')
      .onDelete('CASCADE')

    table.integer('stage_order').notNullable()
    table
      .uuid('request_type_id')
      .notNullable()
      .references('id')
      .inTable('review_request_types')

    table.text('description')
    table.timestamps(true, true)
  })

  await knex.schema.createTable('review_request_stage_approvers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table
      .uuid('stage_id')
      .notNullable()
      .references('id')
      .inTable('review_request_stages')
      .onDelete('CASCADE')

    table
      .uuid('role_id')
      .notNullable()
      .references('id')
      .inTable('roles')
      .onDelete('CASCADE')

    table
      .uuid('request_stage_type_id')
      .notNullable()
      .references('id')
      .inTable('review_request_type_stages')
      .onDelete('CASCADE')
    table.timestamps(true, true)
  })

  await knex.schema.createTable('review_request_approvals', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))

    table
      .uuid('request_id')
      .notNullable()
      .references('id')
      .inTable('review_requests')
      .onDelete('CASCADE')

    table
      .uuid('stage_id')
      .notNullable()
      .references('id')
      .inTable('review_request_stages')
      .onDelete('CASCADE')

    table
      .uuid('approval_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
    table.timestamp('approval_date').notNullable()
    table.text('approval_status').notNullable()
    table.text('comments')
    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('review_request_approvals')
  await knex.schema.dropTable('review_request_stage_approvers')
  await knex.schema.dropTable('review_request_type_stages')
  await knex.schema.dropTable('review_request_stages')
  await knex.schema.dropTable('review_requests')
  await knex.schema.dropTable('review_request_types')
}
