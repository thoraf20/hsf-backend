import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('user_assignments', function (table) {
    table.uuid('id').defaultTo(knex.raw('gen_random_uuid()')).primary()

    table.uuid('user_id').references('id').inTable('users').notNullable() // The user who is assigned (FK to your users table)
    table.string('assignable_id').notNullable() // The ID of the item being assigned to (e.g., Application ID, Task ID)
    table.string('assignable_type').notNullable() // The type of the item (e.g., 'Application', 'Task', 'Project')

    table.string('role').nullable() // Optional: Role of the user in this assignment (e.g., 'LoanOfficer', 'Reviewer')

    table.timestamp('assigned_at', { useTz: true }).defaultTo(knex.fn.now())
    table.timestamp('unassigned_at', { useTz: true }).nullable()
    table.string('reason').nullable()
    table.uuid('created_by_user_id').nullable() // Who initiated this assignment

    // Adds created_at and updated_at columns, typically handled by BaseEntity or ORM
    table.timestamps(true, true)

    // Optional: Add an index for faster lookups
    table.index(['assignable_id', 'assignable_type'])
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('user_assignments')
}
