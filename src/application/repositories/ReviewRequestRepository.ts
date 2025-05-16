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
import db from '@infrastructure/database/knex' // Assuming you have a database connection setup
import { IReviewRequestRepository } from '@interfaces/IReviewRequestRepository'

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

  async getReviewRequestTypeStagesByTypeID(
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

  async getReviewRequestApprovalByRequestID(
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

  async getReviewRequestID(id: string): Promise<ReviewRequest> {
    return db('review_requests').select().where({ id }).first()
  }
}
