import { Knex } from 'knex'
import * as uuid from 'uuid'

const uuidv4 = uuid.v4

import {
  ReviewRequestTypeKind,
  ReviewRequestStageKind,
  ReviewRequestType,
  ReviewRequestStage,
  ReviewRequestTypeStage,
} from '../../src/domain/entities/Request'

export async function seed(knex: Knex) {
  try {
    await reviewRequestStageSeed(knex)
    await Promise.all([offerLetterReviewRequestSeed(knex)])
    console.log(`Review Requests Seeding Completed`)
  } catch (e) {
    console.log(`Review Requests Seeding Failed:`, e)
  }
}

async function reviewRequestStageSeed(knex: Knex) {
  await knex
    .table<ReviewRequestStage>('review_request_stages')
    .upsert({
      name: ReviewRequestStageKind.HsfOfferLetterReview,
    })
    .onConflict(['name'])
    .ignore()

  await knex
    .table<ReviewRequestStage>('review_request_stages')
    .upsert({
      name: ReviewRequestStageKind.LenderBankOfferLetterReview,
    })
    .onConflict(['name'])
    .ignore()
}

async function offerLetterReviewRequestSeed(knex: Knex) {
  const [offerLetterReviewType] = await knex
    .table<ReviewRequestType>('review_request_types')
    .upsert({
      type: ReviewRequestTypeKind.LoanOffer,
      id: uuidv4(),
    })
    .onConflict(['type'])
    .ignore()
    .returning('*')

  const offerLetterReviewStages: Array<ReviewRequestStageKind> = [
    ReviewRequestStageKind.HsfOfferLetterReview,
    ReviewRequestStageKind.LenderBankOfferLetterReview,
  ]

  const reviewRequestTypeStageTable = knex.table<ReviewRequestTypeStage>(
    'review_request_type_stages',
  )

  offerLetterReviewStages.map(async (stage, index) => {
    const reviewStage = await knex
      .table<ReviewRequestStage>('review_request_stages')
      .select()
      .where({ name: stage })
      .first('*')

    if (!stage) {
      throw new Error(`Review request stage '${stage}' not exist`)
    }

    const stageOrder = index + 1
    await reviewRequestTypeStageTable
      .upsert({
        stage_id: reviewStage.id,
        stage_order: stageOrder,
        id: uuidv4(),
        request_type_id: offerLetterReviewType.id,
      })
      .onConflict(['stage_id', 'request_type_id'])
      .merge({ stage_order: stageOrder })
  })
}
