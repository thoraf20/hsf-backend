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

export interface ReviewRequestRepository {
  getReviewRequestStageByKind(
    name: ReviewRequestStageKind,
  ): Promise<ReviewRequestStage>
  getReviewRequestTypeByKind(
    type: ReviewRequestTypeKind,
  ): Promise<ReviewRequestType>

  getReviewStageApproverByStageTypeId(
    typeId: string,
  ): Promise<ReviewRequestStageApprover>
  getReviewRequestTypeStagesByTypeID(
    typeId: string,
  ): Promise<Array<ReviewRequestTypeStage>>

  createReviewRequest(data: Partial<ReviewRequest>): Promise<ReviewRequest>
  createReviewRequestApproval(
    data: Partial<ReviewRequestApproval>,
  ): Promise<ReviewRequestApproval>

  updateReviewRequestApproval(
    approverId: string,
    update: ReviewRequestApproval,
  ): Promise<ReviewRequestApproval>

  getReviewRequestApprovalByRequestID(
    requestId: string,
  ): Promise<ReviewRequestApproval>
}
