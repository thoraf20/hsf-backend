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
import { SeekPaginationResult } from '@shared/types/paginate'
import { ReviewRequestFilters } from '@validators/reviewRequestValidator'

export interface IReviewRequestRepository {
  getReviewRequestStageByKind(
    name: ReviewRequestStageKind,
  ): Promise<ReviewRequestStage>

  getReviewRequestStageByID(id: string): Promise<ReviewRequestStage>
  getReviewRequestTypeByKind(
    type: ReviewRequestTypeKind,
  ): Promise<ReviewRequestType>

  getReviewStageApproverByStageTypeId(
    typeId: string,
  ): Promise<ReviewRequestStageApprover>
  getReviewRequestTypeStagesByRequestTypeID(
    typeId: string,
  ): Promise<Array<ReviewRequestTypeStage>>

  createReviewRequest(data: Partial<ReviewRequest>): Promise<ReviewRequest>
  createReviewRequestApproval(
    data: Partial<ReviewRequestApproval>,
  ): Promise<ReviewRequestApproval>

  updateReviewRequestApproval(
    approverId: string,
    update: Partial<ReviewRequestApproval>,
  ): Promise<ReviewRequestApproval>

  updateReviewRequest(
    id: string,
    update: Partial<ReviewRequest>,
  ): Promise<ReviewRequest>

  getReviewRequestTypeStageByID(id: string): Promise<ReviewRequestTypeStage>

  getReviewRequestApprovalByRequestID(
    requestId: string,
    organizationId: string,
  ): Promise<ReviewRequestApproval>

  getHsfReviewRequests(
    hsfOrgId: string,
    filter: ReviewRequestFilters,
  ): Promise<SeekPaginationResult<ReviewRequest>>

  getOrgReviewRequests(
    filter: ReviewRequestFilters,
  ): Promise<SeekPaginationResult<ReviewRequest>>

  getReviewRequestID(requestId: string): Promise<ReviewRequest>
}
