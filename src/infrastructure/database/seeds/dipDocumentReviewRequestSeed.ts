import { Knex } from 'knex'
import { v4 as uuidv4 } from 'uuid'
import { Role } from '@domain/enums/rolesEnum'

export async function DIPDocumentReviewRequest(knex: Knex): Promise<void> {
  let dipDocumentRequestType = await knex
    .table<ReviewRequestType>('review_request_types')
    .where({ type: ReviewRequestTypeKind.DipDocumentReview })
    .first()

  if (!dipDocumentRequestType) {
    const newTypeId = uuidv4()
    console.log(
      `ReviewRequestType '${ReviewRequestTypeKind.DipDocumentReview}' not found, creating with ID: ${newTypeId}`,
    )
    const insertedTypes = await knex
      .table<ReviewRequestType>('review_request_types')
      .insert({
        id: newTypeId,
        type: ReviewRequestTypeKind.DipDocumentReview,
      })
      .returning('*')
    if (insertedTypes && insertedTypes.length > 0) {
      dipDocumentRequestType = insertedTypes[0]
    } else {
      throw new Error(
        `Failed to create or retrieve ReviewRequestType '${ReviewRequestTypeKind.DipDocumentReview}'`,
      )
    }
  } else {
    console.log(
      `Found existing ReviewRequestType '${ReviewRequestTypeKind.DipDocumentReview}' with ID: ${dipDocumentRequestType.id}`,
    )
  }

  const dipDocumentReviewStagesData: Array<{
    id?: string
    name: ReviewRequestStageKind
    roles: Array<Role>
  }> = [
    {
      name: ReviewRequestStageKind.DIPHsfDocumentReview,
      roles: [
        Role.HSF_COMPLIANCE_OFFICER,
        Role.HSF_ADMIN,
        Role.HSF_LOAN_OFFICER,
      ],
    },

    {
      name: ReviewRequestStageKind.DIPLenderDocumentReview,
      roles: [Role.LENDER_ADMIN, Role.LENDER_LOAN_OFFICER],
    },
  ]

  for (const stageData of dipDocumentReviewStagesData) {
    const reviewStage = await knex
      .table<ReviewRequestStage>('review_request_stages')
      .select('id')
      .where({ name: stageData.name })
      .first()

    if (!reviewStage) {
      throw new Error(
        `CRITICAL: Prerequisite review stage '${stageData.name}' not found in 'review_request_stages' table. Ensure 'reviewRequestStageSeed' ran successfully and the stage exists.`,
      )
    }
    stageData.id = reviewStage.id
  }

  await knex
    .table<ReviewRequestTypeStage>('review_request_type_stages')
    .update({ enabled: false })
    .where({ request_type_id: dipDocumentRequestType.id })
  console.log(
    `Disabled existing stages for request_type_id: ${dipDocumentRequestType.id}`,
  )

  for (const [index, stageData] of dipDocumentReviewStagesData.entries()) {
    const order = index + 1
    if (!stageData.id) {
      throw new Error(`Stage ID is missing for stage ${stageData.name}`)
    }

    console.log(
      `Processing stage: ${stageData.name} (ID: ${stageData.id}) for request_type_id: ${dipDocumentRequestType.id} with order ${order}`,
    )

    let [reviewRequestTypeStageEntry] = await knex
      .table<ReviewRequestTypeStage>('review_request_type_stages')
      .select()
      .where({
        request_type_id: dipDocumentRequestType.id,
        stage_id: stageData.id!,
      })
      .returning('*')

    if (!reviewRequestTypeStageEntry) {
      ;[reviewRequestTypeStageEntry] = await knex
        .table<ReviewRequestTypeStage>('review_request_type_stages')
        .insert({
          stage_order: order,
          enabled: true,
          request_type_id: dipDocumentRequestType.id,
          stage_id: stageData.id!,
        })

        .returning('*')
    } else {
      ;[reviewRequestTypeStageEntry] = await knex
        .table<ReviewRequestTypeStage>('review_request_type_stages')
        .update({
          stage_order: order,
          enabled: true,
          request_type_id: dipDocumentRequestType.id,
          stage_id: stageData.id!,
        })
        .where({ id: reviewRequestTypeStageEntry.id })
        .returning('*')
    }

    if (!reviewRequestTypeStageEntry) {
      throw new Error(
        `Failed to upsert review_request_type_stage for stage_id ${stageData.id} and request_type_id ${dipDocumentRequestType.id}`,
      )
    }

    console.log(
      `Upserted review_request_type_stage (ID: ${reviewRequestTypeStageEntry.id}) for stage: ${stageData.name}`,
    )

    const roles = await knex<UserRole>('roles')
      .select('id', 'name')
      .whereIn('name', stageData.roles)

    if (roles.length !== stageData.roles.length) {
      const foundRoleNames = roles.map((r) => r.name)
      const missingRoles = stageData.roles.filter(
        (r) => !foundRoleNames.includes(r),
      )
      throw new Error(
        `Found missing roles for stage '${
          stageData.name
        }'. Expected: ${stageData.roles.join(
          ', ',
        )}, Found: ${foundRoleNames.join(', ')}. Missing: ${missingRoles.join(
          ', ',
        )}. Ensure all roles are seeded in the 'roles' table.`,
      )
    }

    console.log(
      `Deleting existing approvers for review_request_type_stage_id: ${reviewRequestTypeStageEntry.id}`,
    )
    await knex
      .table<ReviewRequestStageApprover>('review_request_stage_approvers')
      .where({ request_stage_type_id: reviewRequestTypeStageEntry.id! })
      .delete()

    if (roles.length > 0) {
      const approversToInsert = roles.map((role) => ({
        id: uuidv4(),
        request_stage_type_id: reviewRequestTypeStageEntry.id!,
        role_id: role.id,
        stage_id: stageData.id!,
      }))
      console.log(
        `Inserting ${approversToInsert.length} approvers for review_request_type_stage_id: ${reviewRequestTypeStageEntry.id}`,
      )
      await knex
        .table<ReviewRequestStageApprover>('review_request_stage_approvers')
        .insert(approversToInsert)
    }

    console.log(
      `Seeding for review stage '${stageData.name}' (TypeStageID: ${reviewRequestTypeStageEntry.id}) completed.`,
    )
  }
}

export enum ReviewRequestTypeKind {
  OfferLetterOutright = 'Offer Letter Outright',
  EscrowMeetingRequest = 'Escrow Metting Request',
  DipDocumentReview = 'DIP Document Review',
  ConditionPrecedent = 'Condition Precedent',
}

export enum ReviewRequestStageKind {
  HsfOfferLetterReview = 'Hsf Offer Letter Review',
  DeveloperOfferLetterReview = 'Developer Offer Letter Review',

  DeveloperEscrowMeetingRespond = 'Developer Escrow Meeting Respond',
  HomeBuyerEscrowMeetingRespond = 'Home buyer Escrow Meeting Respond',

  DIPHsfDocumentReview = 'DIP Hsf Document Review',
  DIPDeveloperDocumentReview = 'DIP Developer Document Review',
  DIPLenderDocumentReview = 'DIP Lender Document Review',

  HSFConditionPrecedentReview = 'HSF Condition Precedent Review',
  LenderConditionPrecendentReview = 'Lender Condition Precendent Review',
}

interface ReviewRequestType {
  id: string
  type: ReviewRequestTypeKind
}

interface ReviewRequestStage {
  id: string
  name: ReviewRequestStageKind
}

interface ReviewRequestTypeStage {
  id: string
  request_type_id: string
  stage_id: string
  stage_order: number
  enabled: boolean
}

interface ReviewRequestStageApprover {
  id: string
  request_stage_type_id: string
  role_id: string
  stage_id: string
}

interface UserRole {
  id: string
  name: string
}