import { Payment } from '@entities/Payment'
import { User } from '@entities/User'
import db, { createUnion } from '@infrastructure/database/knex'
import { IPaymentRepository } from '@interfaces/IPaymentRepository'
import { SeekPaginationResult } from '@shared/types/paginate'
import { SearchType } from '@shared/types/repoTypes'
import { applyPagination } from '@shared/utils/paginate'
import { PaymentFilters } from '@validators/paymentValidator'
import { Knex } from 'knex'

export class PaymentRepostory implements IPaymentRepository {
  async create(data: Partial<Payment>): Promise<Payment> {
    const [created] = await db('payments').insert(data).returning('*')
    return created
  }

  async update(data: Partial<Payment>): Promise<Payment> {
    const [updated] = await db('payments')
      .update(data)
      .where('payment_id', data.payment_id)
      .returning('*')
    return updated
  }

  getById(id: string): Promise<Payment & { payer?: User }> {
    return db('payments as p')
      .leftJoin('users as u', 'u.id', 'p.user_id')
      .select('p.*', db.raw('row_to_json(u) as payer'))
      .where({ payment_id: id })
      .first()
  }

  getByTransactionRef(ref: string): Promise<Payment & { payer?: User }> {
    return db('payments as p')
      .leftJoin('users as u', 'u.id', 'p.user_id')
      .leftJoin('roles as r', 'r.id', 'u.role_id')
      .select(
        'p.*',
        db.raw('row_to_json(u) as payer'),
        db.raw('row_to_json(r) as role'),
      )
      .where({ reference: ref })
      .first()
  }

  getByType(type: string): Promise<Payment & { payer?: User }> {
    return db<Payment>('payments as p')
      .leftJoin('users as u', 'u.id', 'p.user_id')
      .leftJoin('roles as r', 'r.id', 'u.role_id')
      .select(
        'p.*',
        db.raw('row_to_json(u) as payer'),
        db.raw('row_to_json(r) as role'),
      )
      .where({ payment_type: type })
      .first()
  }

  useFilters(q: Knex.QueryBuilder<any, any[]>, filters: PaymentFilters) {
    const add = createUnion(SearchType.EXCLUSIVE)

    if (filters.q) {
      q = add(q).where((builder) => {
        builder.where((searchBuilder) => {
          searchBuilder.whereILike('p.payment_id', `%${filters.q}%`)
          if (!Number.isNaN(Number(filters.q))) {
            searchBuilder.orWhereILike('p.amount', `%${filters.q}%`)
          }
          searchBuilder.orWhere(function () {
            this.whereILike('u.first_name', `%${filters.q}%`).orWhereILike(
              'u.last_name',
              `%${filters.q}%`,
            )
          })
        })
      })
    }

    if (filters.user_id) {
      q = add(q).whereRaw(`p.user_id = '${filters.user_id}'`)
    }

    if (filters.payment_type) {
      q = add(q).where('p.payment_type', '=', filters.payment_type)
    }

    if (filters.application_id) {
      q = q.whereRaw(`p.metadata::jsonb ->> 'application_id' = ?`, [
        filters.application_id,
      ])
    }

    return q
  }

  getAll(
    filters: PaymentFilters,
  ): Promise<SeekPaginationResult<Payment & { payer?: User }>> {
    let baseQuery = db<Payment>('payments as p')
      .leftJoin('users as u', 'u.id', 'p.user_id')
      .leftJoin('roles as r', 'r.id', 'u.role_id')
      .select(
        'p.*',
        db.raw('row_to_json(u) as payer'),
        db.raw('row_to_json(r) as role'),
      )

    baseQuery = this.useFilters(baseQuery, filters)

    baseQuery = baseQuery.orderBy('p.created_at', 'desc')
    return applyPagination(baseQuery, filters)
  }
}
