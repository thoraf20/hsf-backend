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
    await offerLetterReviewRequestSeed(knex)
    console.log(`Review Requests Seeding Completed`)
  } catch (e) {
    console.error(`Review Requests Seeding Failed:`, e)
  }
}

async function reviewRequestStageSeed(knex: Knex) {
  for (const stage of [
    ReviewRequestStageKind.HsfOfferLetterReview,
    ReviewRequestStageKind.LenderBankOfferLetterReview,
  ]) {
    const existingStage = await knex
      .table<ReviewRequestStage>('review_request_stages')
      .where({ name: stage })
      .first()
    if (existingStage) {
      // If the stage exists, we don't need to do anything
      continue
    }

    try {
      await knex
        .table<ReviewRequestStage>('review_request_stages')
        .insert({ name: stage })
    } catch (error: any) {
      // If the insert fails because of a conflict, we ignore the error
      if (error.code === '23505') {
        // PostgreSQL error code for unique violation
        console.log(`Stage '${stage}' already exists. Skipping insert.`)
      } else {
        // If it's another error, we throw it
        throw error
      }
    }
  }
}

async function offerLetterReviewRequestSeed(knex: Knex) {
  let offerLetterReviewType = await knex
    .table<ReviewRequestType>('review_request_types')
    .where({ type: ReviewRequestTypeKind.LoanOffer })
    .first()

  if (!offerLetterReviewType) {
    ;[offerLetterReviewType] = await knex
      .table<ReviewRequestType>('review_request_types')
      .insert({
        type: ReviewRequestTypeKind.LoanOffer,
        id: uuidv4(),
      })
      .returning('*')
  }

  const offerLetterReviewStages: Array<ReviewRequestStageKind> = [
    ReviewRequestStageKind.HsfOfferLetterReview,
    ReviewRequestStageKind.LenderBankOfferLetterReview,
  ]

  const reviewRequestTypeStageTable = knex.table<ReviewRequestTypeStage>(
    'review_request_type_stages',
  )

  for (const stage of offerLetterReviewStages) {
    const reviewStage = await knex
      .table<ReviewRequestStage>('review_request_stages')
      .select()
      .where({ name: stage })
      .first('*')

    if (!stage) {
      throw new Error(`Review request stage \'${stage}\' not exist`)
    }

    const stageOrder = offerLetterReviewStages.indexOf(stage) + 1

    let existingTypeStage = await reviewRequestTypeStageTable
      .select()
      .where({
        stage_id: reviewStage.id,
        request_type_id: offerLetterReviewType.id,
      })
      .limit(1)

    console.log({ existingTypeStage, stageOrder })

    if (!existingTypeStage) {
      await reviewRequestTypeStageTable.insert({
        stage_id: reviewStage.id,
        stage_order: stageOrder,
        id: uuidv4(),
        request_type_id: offerLetterReviewType.id,
      })
    } else {
      await reviewRequestTypeStageTable
        .where({
          stage_id: reviewStage.id,
          request_type_id: offerLetterReviewType.id,
        })
        .update({ stage_order: stageOrder })
    }
  }
}
