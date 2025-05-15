import { OfferLetter } from '@entities/PropertyPurchase'
import { IOfferLetterRepository } from '@domain/interfaces/IOfferLetterRepository'
import { SeekPaginationResult } from '@shared/types/paginate'
import db, { createUnion } from '@infrastructure/database/knex' // Assuming you have a database connection setup
import { Knex } from 'knex'
import { OfferLetterFilters } from '@validators/applicationValidator'
import { SearchType } from '@shared/types/repoTypes'
import { applyPagination } from '@shared/utils/paginate'

export class OfferLetterRepository implements IOfferLetterRepository {
  private readonly db: Knex
  constructor() {
    this.db = db
  }
  async create(input: Partial<OfferLetter>): Promise<OfferLetter> {
    const [newOfferLetter] = await this.db<OfferLetter>('offer_letters')
      .insert(input)
      .returning('*')
    return newOfferLetter
  }

  async getByUserId(userId: string): Promise<OfferLetter[]> {
    const offerLetters = await db<OfferLetter>('offer_letters').where({
      user_id: userId,
    })
    return offerLetters
  }

  useFilter(
    query: Knex.QueryBuilder<any, any[]>,
    filters: OfferLetterFilters,
    tablename = '',
  ) {
    let q = query

    if (filters == null || Object.keys(filters).length < 1) return q
    const add = createUnion(SearchType.EXCLUSIVE)

    if (filters.status) {
      const property_types = filters.status.split(',')

      const qq = []

      let index = 0
      for (const alt_property_type of property_types) {
        const property_type = alt_property_type.trim()
        if (property_types.length > 1 && index < 1) {
          qq.push('(')
        }
        if (index == 0) {
          qq.push(`${tablename}property_type ILIKE '${property_type}'`)
        } else {
          qq.push(`OR ${tablename}property_type ILIKE '${property_type}' `)
        }
        index++
      }
      if (qq?.[0] == '(') qq.push(')')

      q = add(q).whereRaw(qq.join(' '))
    }

    if (filters.user_id) {
      q = add(q).whereRaw(`${tablename}user_id = '${filters.user_id}'`)
    }

    return q
  }

  async getAll(
    filters: OfferLetterFilters,
  ): Promise<SeekPaginationResult<OfferLetter>> {
    let baseQuery = db<OfferLetter>('offer_letter')
    baseQuery = this.useFilter(baseQuery, filters)

    baseQuery = baseQuery.orderBy('offer_letter.created_at', 'desc')

    const paginationResult = await applyPagination<OfferLetter>(
      baseQuery,
      filters,
    )

    return paginationResult
  }

  async update(id: string, data: Partial<OfferLetter>): Promise<OfferLetter> {
    const [updatedOfferLetter] = await db<OfferLetter>('offer_letters')
      .where({ offer_letter_id: id })
      .update(data)
      .returning('*')
    return updatedOfferLetter
  }

  async delete(id: string): Promise<OfferLetter> {
    const [deletedOfferLetter] = await db<OfferLetter>('offer_letters')
      .where({ offer_letter_id: id })
      .del()
      .returning('*')
    return deletedOfferLetter
  }
}
