import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('transactions', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('transaction_id').notNullable()
        table.string('transaction_type').notNullable()
        table.string('remark')
        table.string('status').checkIn(['pending', 'successfull', 'failed', 'reversed']).notNullable().defaultTo("pending");
        table.decimal('amount', 12, 2).notNullable();
        table.uuid('user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .onUpdate('CASCADE');
        table.timestamps(true, true)
    

    })
    
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('transactions');
}

