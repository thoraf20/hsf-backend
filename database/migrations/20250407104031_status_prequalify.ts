import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('prequalify_status', (table) => {
      table.string('reference_id').notNullable().defaultTo('');
    });
  }
  
  export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('prequalify_status', (table) => {
      table.dropColumn('reference_id');
    });
  }
  
