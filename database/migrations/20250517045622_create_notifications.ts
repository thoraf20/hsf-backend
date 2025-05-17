import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Create the frequencies table
  await knex.schema.createTable('frequencies', (table) => {
    table
      .uuid('frequency_id')
      .primary()
      .defaultTo(knex.raw('gen_random_uuid()'))

    table.string('name', 50).unique().notNullable()
    table.timestamps(true, true)
  })

  // Create the notification_types table
  await knex.schema.createTable('notification_types', (table) => {
    table
      .uuid('notification_type_id')
      .primary()
      .defaultTo(knex.raw('gen_random_uuid()'))

    table.string('name', 100).unique().notNullable()
    table.text('description').nullable()
    table.timestamps(true, true)
  })

  // Create the notification_mediums table
  await knex.schema.createTable('notification_mediums', (table) => {
    table
      .uuid('notification_medium_id')
      .primary()
      .defaultTo(knex.raw('gen_random_uuid()'))
    table.string('name', 50).unique().notNullable() // e.g., 'Email', 'SMS', 'In-App'
    table.timestamps(true, true)
  })

  // Create the user_enabled_mediums table
  await knex.schema.createTable('user_enabled_mediums', (table) => {
    table
      .uuid('user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .onUpdate('CASCADE')
      .notNullable()

    table
      .uuid('notification_medium_id')
      .references('notification_medium_id')
      .inTable('notification_mediums')
      .onDelete('CASCADE')
      .onUpdate('CASCADE')
      .notNullable()

    table.primary(['user_id', 'notification_medium_id'])
    table.timestamps(true, true)
  })

  // Create the user_subscribed_notification_types table
  await knex.schema.createTable(
    'user_subscribed_notification_types',
    (table) => {
      table
        .uuid('user_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
        .notNullable()

      table
        .uuid('notification_type_id')
        .references('notification_type_id')
        .inTable('notification_types')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
        .notNullable()

      table
        .uuid('frequency_id')
        .references('frequency_id')
        .inTable('frequencies')
        .nullable()

      table.primary(['user_id', 'notification_type_id'])

      table.timestamps(true, true)
    },
  )
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order of creation due to foreign key constraints
  await knex.schema.dropTableIfExists('user_subscribed_notification_types')
  await knex.schema.dropTableIfExists('user_enabled_mediums')
  await knex.schema.dropTableIfExists('notification_mediums')
  await knex.schema.dropTableIfExists('notification_types')
  await knex.schema.dropTableIfExists('frequencies')
}
