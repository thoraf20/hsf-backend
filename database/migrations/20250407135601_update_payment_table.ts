import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('payments', (table) => {
      table.string('total_closing').notNullable();
      table.string('down_payment').notNullable();
      table.string('outstanding_amount').notNullable();

    });
  }
  
  export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('payments', (table) => {
      table.dropColumn('total_closing');
      table.dropColumn('down_payment');
      table.dropColumn('outstanding_amount');
    });
  }
  
