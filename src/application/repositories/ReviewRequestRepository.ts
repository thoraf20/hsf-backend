// HSF-Backend-New/src/application/repositories/ReviewRequestRepository.ts
import {
  ReviewRequest,
  ReviewRequestApproval,
  ReviewRequestStage,
  ReviewRequestStageApprover,
  ReviewRequestStageKind,
  ReviewRequestType,
  ReviewRequestTypeKind,
  ReviewRequestTypeStage,
} from '@entities/Request'
import db, { createUnion } from '@infrastructure/database/knex' // Assuming you have a database connection setup
import { IReviewRequestRepository } from '@interfaces/IReviewRequestRepository'
import { SeekPaginationResult } from '@shared/types/paginate'
import { SearchType } from '@shared/types/repoTypes'
import { addQueryUnionFilter } from '@shared/utils/helpers'
import { applyPagination } from '@shared/utils/paginate'
import { ReviewRequestFilters } from '@validators/reviewRequestValidator'
import { Knex } from 'knex'

export class ReviewRequestRepository implements IReviewRequestRepository {
  async getReviewRequestStageByKind(
    name: ReviewRequestStageKind,
  ): Promise<ReviewRequestStage> {
    try {
      const stage = await db('review_request_stages').where({ name }).first()
      return stage
    } catch (error) {
      console.error('Error getting review request stage by kind:', error)
      throw new Error('Failed to get review request stage by kind')
    }
  }

  async getReviewRequestStageByID(id: string): Promise<ReviewRequestStage> {
    const stage = await db<ReviewRequestStage>('review_request_stages')
      .where({ id })
      .first()
    return stage
  }

  async getReviewRequestTypeByKind(
    type: ReviewRequestTypeKind,
  ): Promise<ReviewRequestType> {
    try {
      const reviewType = await db('review_request_types')
        .where({ type })
        .first()
      return reviewType
    } catch (error) {
      console.error('Error getting review request type by kind:', error)
      throw new Error('Failed to get review request type by kind')
    }
  }

  async getReviewStageApproverByStageTypeId(
    typeId: string,
  ): Promise<ReviewRequestStageApprover> {
    try {
      const approver = await db('review_request_stage_approvers')
        .where({ request_stage_type_id: typeId })
        .first()
      return approver
    } catch (error) {
      console.error(
        'Error getting review stage approver by stage type ID:',
        error,
      )
      throw new Error('Failed to get review stage approver by stage type ID')
    }
  }
  async getReviewRequestTypeStageByID(
    id: string,
  ): Promise<ReviewRequestTypeStage> {
    try {
      const stages = await db<ReviewRequestTypeStage>(
        'review_request_type_stages',
      )
        .where({
          id: id,
        })
        .first()
      return stages
    } catch (error) {
      console.error('Error getting review request type stage by ID:', error)
      throw new Error('Failed to get review request type stage by type ID')
    }
  }

  async getReviewRequestTypeStagesByRequestTypeID(
    typeId: string,
  ): Promise<ReviewRequestTypeStage[]> {
    try {
      const stages = await db<ReviewRequestTypeStage>(
        'review_request_type_stages',
      )
        .where({
          request_type_id: typeId,
          enabled: true,
        })
        .orderBy('stage_order', 'asc')
      return stages
    } catch (error) {
      console.error(
        'Error getting review request type stages by type ID:',
        error,
      )
      throw new Error('Failed to get review request type stages by type ID')
    }
  }

  async createReviewRequest(
    data: Partial<ReviewRequest>,
  ): Promise<ReviewRequest> {
    try {
      const [newRequest] = await db('review_requests')
        .insert(data)
        .returning('*')
      return newRequest
    } catch (error) {
      console.error('Error creating review request:', error)
      throw new Error('Failed to create review request')
    }
  }

  async createReviewRequestApproval(
    data: Partial<ReviewRequestApproval>,
  ): Promise<ReviewRequestApproval> {
    try {
      const [newApproval] = await db('review_request_approvals')
        .insert(data)
        .returning('*')
      return newApproval
    } catch (error) {
      console.error('Error creating review request approval:', error)
      throw new Error('Failed to create review request approval')
    }
  }

  async updateReviewRequestApproval(
    approverId: string,
    update: ReviewRequestApproval,
  ): Promise<ReviewRequestApproval> {
    try {
      const [updatedApproval] = await db('review_request_approvals')
        .where({ id: approverId })
        .update(update)
        .returning('*')
      return updatedApproval
    } catch (error) {
      console.error('Error updating review request approval:', error)
      throw new Error('Failed to update review request approval')
    }
  }

  async getReviewRequestApprovalById(
    approvalId: string,
  ): Promise<ReviewRequestApproval> {
    return db<ReviewRequestApproval>('review_request_approvals')
      .select()
      .where({ id: approvalId })
      .first()
  }

  async updateReviewRequest(
    id: string,
    update: Partial<ReviewRequest>,
  ): Promise<ReviewRequest> {
    try {
      const [updatedReviewRequest] = await db('review_requests')
        .where({ id })
        .update(update)
        .returning('*')
      return updatedReviewRequest
    } catch (error) {
      console.error('Error updating review request approval:', error)
      throw new Error('Failed to update review request approval')
    }
  }

  async getReviewRequestApprovalByOrgRequestID(
    requestId: string,
    organizationId: string,
  ): Promise<ReviewRequestApproval> {
    try {
      const approval = await db('review_request_approvals')
        .where({ request_id: requestId, organization_id: organizationId })
        .first()
      return approval
    } catch (error) {
      console.error(
        'Error getting review request approval by request ID:',
        error,
      )
      throw new Error('Failed to get review request approval by request ID')
    }
  }

  getReviewRequestApprovalByRequestID(requestId: string): Promise<
    (ReviewRequestApproval & {
      review_request: ReviewRequest
      review_request_stage: ReviewRequestStage
      review_request_type_stage: ReviewRequestTypeStage
      request_approvers: Array<ReviewRequestStageApprover>
    })[]
  > {
    return db<any>('review_request_approvals as rra')
      .innerJoin(
        'review_request_type_stages as rrts',
        'rrts.id',
        'rra.review_request_stage_type_id',
      )
      .innerJoin('review_request_stages as rrs', 'rrs.id', 'rrts.stage_id')
      .leftJoin(
        'review_request_stage_approvers as rrsa',
        'rrsa.request_stage_type_id',
        'rra.review_request_stage_type_id',
      )
      .innerJoin('review_requests as rr', 'rr.id', 'rra.request_id')
      .select(
        'rra.*',
        db.raw('row_to_json(rrs) as review_request_stage'),
        db.raw('row_to_json(rr) as review_request'),
        db.raw('row_to_json(rrts) as review_request_type_stage'),
        db.raw(
          `coalesce(json_agg(row_to_json(rrsa)) FILTER (WHERE rrsa.id IS NOT NULL),'[]'::json) as request_approvers`,
        ),
      )

      .where({ request_id: requestId })
      .groupBy('rra.id', 'rrs.*', 'rr.id', 'rrts.id')
  }

  async getReviewRequestID(id: string): Promise<ReviewRequest> {
    return db('review_requests').select().where({ id }).first()
  }

  useFilters(
    query: Knex.QueryBuilder<any, any[]>,
    filters: ReviewRequestFilters,
    viewOnly = false,
  ) {
    let q = query
    if (filters == null || Object.keys(filters).length < 1) return q

    const add = createUnion(SearchType.EXCLUSIVE)

    if (filters.organization_id) {
      q = add(q).whereRaw(`rra.organization_id = '${filters.organization_id}'`)
    }

    if (filters.user_id) {
      q = add(q).whereRaw(`rr.initiator_id = '${filters.user_id}'`)
    }

    if (filters.approver_id) {
      q = add(q).whereRaw(`rra.approval_id = '${filters.approver_id}'`)
    }

    if (filters.request_stage_type_ids?.length) {
      if (viewOnly) {
        q = add(q).whereRaw(
          addQueryUnionFilter(
            'rr.request_type_id',
            filters.request_stage_type_ids,
          ),
        )
      } else {
        q = add(q).whereRaw(
          addQueryUnionFilter(
            'rra.review_request_stage_type_id',
            filters.request_stage_type_ids,
          ),
        )
      }
    }

    return q
  }

  async getOrgReviewRequests(
    filters: ReviewRequestFilters,
  ): Promise<
    SeekPaginationResult<ReviewRequest & { approval: ReviewRequestApproval }>
  > {
    let baseQuery = db<ReviewRequest>('review_requests as rr')
      .leftJoin('review_request_approvals as rra', (qb) => {
        qb.on('rr.id', 'rra.request_id')
      })
      .groupBy('rr.id', 'rra.id')

    baseQuery = this.useFilters(baseQuery, filters, true)
    baseQuery = baseQuery.orderBy('rr.created_at', 'desc')

    baseQuery = baseQuery
      .select('rr.*', db.raw('row_to_json(rra) as approval'))
      .orderBy('rra.created_at', 'desc')

    console.log({ sql: baseQuery.toSQL().sql })

    return applyPagination<ReviewRequest & { approval: ReviewRequestApproval }>(
      baseQuery,
    )
  }
}
