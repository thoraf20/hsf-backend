import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('organizations', (table) => {
    table.string('contact_email').nullable()
    table.string('contact_phone').nullable()
    table.string('address').nullable()
    table.string('city').nullable()
    table.string('state').nullable()
    table.string('postal_code').nullable()
    table.string('org_reg_no').nullable()
    table.timestamp('org_reg_no_verified', { useTz: true }).nullable()
    table.string('logo_url').nullable()
    table.string('primary_color').nullable()
    table.timestamp('approval_date', { useTz: true }).nullable()
    table.timestamp('suspension_date', { useTz: true }).nullable()
    table.timestamp('deletion_date', { useTz: true }).nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('organizations', (table) => {
    table.dropColumn('contact_email')
    table.dropColumn('contact_phone')
    table.dropColumn('address')
    table.dropColumn('city')
    table.dropColumn('state')
    table.dropColumn('postal_code')
    table.dropColumn('logo_url')
    table.dropColumn('primary_color')
    table.dropColumn('approval_date')
    table.dropColumn('suspension_date')
    table.dropColumn('deletion_date')
  })
}
