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

  getById(id: string): Promise<Payment & { payer?: User }> {
    return db('payments')
      .leftJoin('users as u', 'u.id', 'payments.user_id')
      .select('payments.*', db.raw('row_to_json(u) as payer'))
      .where({ id })
      .first()
  }

  getByType(type: string): Promise<Payment & { payer?: User }> {
    return db('payments')
      .leftJoin('users as u', 'u.id', 'payments.user_id')
      .select('payments.*', db.raw('row_to_json(u) as payer'))
      .where({ paymentType: type })
      .first()
  }

  useFilters(q: Knex.QueryBuilder<any, any[]>, filters: PaymentFilters) {
    const add = createUnion(SearchType.EXCLUSIVE)

    if (filters.q) {
      q = add(q).where((builder) => {
        builder.where((searchBuilder) => {
          searchBuilder.whereILike('payments.id', `%${filters.q}%`)
          if (!Number.isNaN(Number(filters.q))) {
            searchBuilder.orWhereILike('amount', `%${filters.q}%`)
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
      q = add(q).where('payments.user_id', filters.user_id)
    }

    return q
  }

  getAll(
    filters: PaymentFilters,
  ): Promise<SeekPaginationResult<Payment & { payer?: User }>> {
    let baseQuery = db<Payment>('payments')
      .leftJoin('users as u', 'u.id', 'payments.user_id')
      .select('payments.*', db.raw('row_to_json(u) as payer'))

    baseQuery = this.useFilters(baseQuery, filters)
    baseQuery = baseQuery.orderBy('payments.created_at', 'desc')
    return applyPagination(baseQuery, filters)
  }
}
