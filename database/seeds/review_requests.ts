import { Knex } from 'knex'
import * as uuid from 'uuid'

const uuidv4 = uuid.v4

import {
  ReviewRequestTypeKind,
  ReviewRequestStageKind,
  ReviewRequestType,
  ReviewRequestStage,
  ReviewRequestTypeStage,
  ReviewRequestStageApprover,
} from '../../src/domain/entities/Request' // Assuming path is correct
import { UserRole } from '../../src/domain/entities/User' // Assuming path is correct
import { OrganizationType } from '../../src/domain/enums/organizationEnum' // Assuming path is correct
import { Role } from '../../src/domain/enums/rolesEmun' // Assuming path is correct

export async function seed(knex: Knex): Promise<void> {
  try {
    await reviewRequestStageSeed(knex)
    await offerLetterReviewRequestSeed(knex)
    await escrowMeetingRequest(knex)
    await DIPDocumentReviewRequest(knex)
    await ConditionPrecedentReviewRequest(knex)
    console.log(`Review Requests Seeding Completed`)
  } catch (e) {
    console.error(`Review Requests Seeding Failed:`, e)
    // Optional: rethrow the error if you want the seed run to fail explicitly
    // throw e;
  }
}

async function reviewRequestStageSeed(knex: Knex): Promise<void> {
  const stages = [
    {
      name: ReviewRequestStageKind.HsfOfferLetterReview,
      organization_type: OrganizationType.HSF_INTERNAL,
    },
    {
      name: ReviewRequestStageKind.DeveloperOfferLetterReview,
      organization_type: OrganizationType.DEVELOPER_COMPANY,
    },

    {
      name: ReviewRequestStageKind.HomeBuyerEscrowMeetingRespond,
      organization_type: OrganizationType.HSF_INTERNAL,
    },

    {
      name: ReviewRequestStageKind.DeveloperEscrowMeetingRespond,
      organization_type: OrganizationType.DEVELOPER_COMPANY,
    },

    {
      name: ReviewRequestStageKind.DIPHsfDocumentReview,
      organization_type: OrganizationType.HSF_INTERNAL,
    },

    {
      name: ReviewRequestStageKind.DIPDeveloperDocumentReview,
      organization_type: OrganizationType.DEVELOPER_COMPANY,
    },

    {
      name: ReviewRequestStageKind.DIPLenderDocumentReview,
      organization_type: OrganizationType.LENDER_INSTITUTION,
    },

    {
      name: ReviewRequestStageKind.HSFConditionPrecedentReview,
      organization_type: OrganizationType.HSF_INTERNAL,
    },

    {
      name: ReviewRequestStageKind.LenderConditionPrecendentReview,
      organization_type: OrganizationType.LENDER_INSTITUTION,
    },
  ]

  for (const stage of stages) {
    const existingStage = await knex
      .table<ReviewRequestStage>('review_request_stages')
      .where({ name: stage.name, organization_type: stage.organization_type })
      .first()

    if (existingStage) {
      console.log(`Stage '${stage.name}' already exists. Skipping insert.`)
      continue
    }

    try {
      await knex.table<ReviewRequestStage>('review_request_stages').insert({
        id: uuidv4(), // It's good practice to add an ID if your table requires it
        name: stage.name,
        organization_type: stage.organization_type,
      })
      console.log(`Stage '${stage.name}' seeded successfully.`)
    } catch (error: any) {
      if (error.code === '23505') {
        console.warn(
          `Attempted to insert duplicate stage '${stage.name}', but it was likely created concurrently. Skipping.`,
        )
      } else {
        console.error(`Error seeding stage '${stage.name}':`, error)
        throw error
      }
    }
  }
}

async function offerLetterReviewRequestSeed(knex: Knex): Promise<void> {
  let offerLetterReviewType = await knex
    .table<ReviewRequestType>('review_request_types')
    .where({ type: ReviewRequestTypeKind.OfferLetterOutright })
    .first()

  if (!offerLetterReviewType) {
    const newTypeId = uuidv4()
    console.log(
      `ReviewRequestType '${ReviewRequestTypeKind.OfferLetterOutright}' not found, creating with ID: ${newTypeId}`,
    )
    const insertedTypes = await knex
      .table<ReviewRequestType>('review_request_types')
      .insert({
        id: newTypeId,
        type: ReviewRequestTypeKind.OfferLetterOutright,
      })
      .returning('*')
    if (insertedTypes && insertedTypes.length > 0) {
      offerLetterReviewType = insertedTypes[0]
    } else {
      throw new Error(
        `Failed to create or retrieve ReviewRequestType '${ReviewRequestTypeKind.OfferLetterOutright}'`,
      )
    }
  } else {
    console.log(
      `Found existing ReviewRequestType '${ReviewRequestTypeKind.OfferLetterOutright}' with ID: ${offerLetterReviewType.id}`,
    )
  }

  const offerLetterReviewStagesData: Array<{
    id?: string
    name: ReviewRequestStageKind
    roles: Array<Role>
  }> = [
    {
      name: ReviewRequestStageKind.DeveloperOfferLetterReview,
      roles: [Role.DEVELOPER_ADMIN, Role.DEVELOPER_AGENT],
    },
  ]

  for (const stageData of offerLetterReviewStagesData) {
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
    .where({ request_type_id: offerLetterReviewType.id })

  console.log(
    `Disabled existing stages for request_type_id: ${offerLetterReviewType.id}`,
  )

  for (const [index, stageData] of offerLetterReviewStagesData.entries()) {
    const order = index + 1
    if (!stageData.id) {
      throw new Error(`Stage ID is missing for stage ${stageData.name}`)
    }

    console.log(
      `Processing stage: ${stageData.name} (ID: ${stageData.id}) for request_type_id: ${offerLetterReviewType.id} with order ${order}`,
    )

    let [reviewRequestTypeStageEntry] = await knex
      .table<ReviewRequestTypeStage>('review_request_type_stages')
      .select()
      .where({
        request_type_id: offerLetterReviewType.id,
        stage_id: stageData.id!,
      })
      .returning('*')

    if (!reviewRequestTypeStageEntry) {
      ;[reviewRequestTypeStageEntry] = await knex
        .table<ReviewRequestTypeStage>('review_request_type_stages')
        .insert({
          stage_order: order,
          enabled: true,
          request_type_id: offerLetterReviewType.id,
          stage_id: stageData.id!,
        })

        .returning('*')
    } else {
      await knex
        .table<ReviewRequestTypeStage>('review_request_type_stages')
        .update({
          stage_order: order,
          enabled: true,
        })
        .where({ id: reviewRequestTypeStageEntry.id })
    }

    if (!reviewRequestTypeStageEntry) {
      throw new Error(
        `Failed to upsert review_request_type_stage for stage_id ${stageData.id} and request_type_id ${offerLetterReviewType.id}`,
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

async function escrowMeetingRequest(knex: Knex): Promise<void> {
  let escrowMettingRequestType = await knex
    .table<ReviewRequestType>('review_request_types')
    .where({ type: ReviewRequestTypeKind.EscrowMeetingRequest })
    .first()

  if (!escrowMettingRequestType) {
    const newTypeId = uuidv4()
    console.log(
      `ReviewRequestType '${ReviewRequestTypeKind.EscrowMeetingRequest}' not found, creating with ID: ${newTypeId}`,
    )
    const insertedTypes = await knex
      .table<ReviewRequestType>('review_request_types')
      .insert({
        id: newTypeId,
        type: ReviewRequestTypeKind.EscrowMeetingRequest,
      })
      .returning('*')
    if (insertedTypes && insertedTypes.length > 0) {
      escrowMettingRequestType = insertedTypes[0]
    } else {
      throw new Error(
        `Failed to create or retrieve ReviewRequestType '${ReviewRequestTypeKind.EscrowMeetingRequest}'`,
      )
    }
  } else {
    console.log(
      `Found existing ReviewRequestType '${ReviewRequestTypeKind.EscrowMeetingRequest}' with ID: ${escrowMettingRequestType.id}`,
    )
  }

  const escrowMeetingReviewStagesData: Array<{
    id?: string
    name: ReviewRequestStageKind
    roles: Array<Role>
  }> = [
    {
      name: ReviewRequestStageKind.DeveloperEscrowMeetingRespond,
      roles: [Role.DEVELOPER_ADMIN, Role.DEVELOPER_AGENT],
    },

    {
      name: ReviewRequestStageKind.HomeBuyerEscrowMeetingRespond,
      roles: [Role.HOME_BUYER],
    },
  ]

  for (const stageData of escrowMeetingReviewStagesData) {
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
    .where({ request_type_id: escrowMettingRequestType.id })
  console.log(
    `Disabled existing stages for request_type_id: ${escrowMettingRequestType.id}`,
  )

  for (const [index, stageData] of escrowMeetingReviewStagesData.entries()) {
    const order = index + 1
    if (!stageData.id) {
      throw new Error(`Stage ID is missing for stage ${stageData.name}`)
    }

    console.log(
      `Processing stage: ${stageData.name} (ID: ${stageData.id}) for request_type_id: ${escrowMettingRequestType.id} with order ${order}`,
    )

    let [reviewRequestTypeStageEntry] = await knex
      .table<ReviewRequestTypeStage>('review_request_type_stages')
      .select()
      .where({
        request_type_id: escrowMettingRequestType.id,
        stage_id: stageData.id!,
      })
      .returning('*')

    if (!reviewRequestTypeStageEntry) {
      ;[reviewRequestTypeStageEntry] = await knex
        .table<ReviewRequestTypeStage>('review_request_type_stages')
        .insert({
          stage_order: order,
          enabled: true,
          request_type_id: escrowMettingRequestType.id,
          stage_id: stageData.id!,
        })

        .returning('*')
    } else {
      await knex
        .table<ReviewRequestTypeStage>('review_request_type_stages')
        .update({
          stage_order: order,
          enabled: true,
        })
        .where({ id: reviewRequestTypeStageEntry.id })
    }

    if (!reviewRequestTypeStageEntry) {
      throw new Error(
        `Failed to upsert review_request_type_stage for stage_id ${stageData.id} and request_type_id ${escrowMettingRequestType.id}`,
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

async function DIPDocumentReviewRequest(knex: Knex): Promise<void> {
  let dipDocumentRequestType = await knex
    .table<ReviewRequestType>('review_request_types')
    .where({ type: ReviewRequestTypeKind.DipDocumentReview })
    .first()

  if (!dipDocumentRequestType) {
    const newTypeId = uuidv4()
    console.log(
      `ReviewRequestType '${ReviewRequestTypeKind.EscrowMeetingRequest}' not found, creating with ID: ${newTypeId}`,
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
        `Failed to create or retrieve ReviewRequestType '${ReviewRequestTypeKind.EscrowMeetingRequest}'`,
      )
    }
  } else {
    console.log(
      `Found existing ReviewRequestType '${ReviewRequestTypeKind.EscrowMeetingRequest}' with ID: ${dipDocumentRequestType.id}`,
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

export async function ConditionPrecedentReviewRequest(
  knex: Knex,
): Promise<void> {
  let conditionPrecedentRequestType = await knex
    .table<ReviewRequestType>('review_request_types')
    .where({ type: ReviewRequestTypeKind.ConditionPrecedent })
    .first()

  if (!conditionPrecedentRequestType) {
    const newTypeId = uuidv4()
    console.log(
      `ReviewRequestType '${ReviewRequestTypeKind.ConditionPrecedent}' not found, creating with ID: ${newTypeId}`,
    )
    const insertedTypes = await knex
      .table<ReviewRequestType>('review_request_types')
      .insert({
        id: newTypeId,
        type: ReviewRequestTypeKind.ConditionPrecedent,
      })
      .returning('*')
    if (insertedTypes && insertedTypes.length > 0) {
      conditionPrecedentRequestType = insertedTypes[0]
    } else {
      throw new Error(
        `Failed to create or retrieve ReviewRequestType '${ReviewRequestTypeKind.ConditionPrecedent}'`,
      )
    }
  } else {
    console.log(
      `Found existing ReviewRequestType '${ReviewRequestTypeKind.ConditionPrecedent}' with ID: ${conditionPrecedentRequestType.id}`,
    )
  }

  const conditionPrecedentReviewStagesData: Array<{
    id?: string
    name: ReviewRequestStageKind
    roles: Array<Role>
  }> = [
    {
      name: ReviewRequestStageKind.HSFConditionPrecedentReview,
      roles: [
        Role.HSF_COMPLIANCE_OFFICER,
        Role.HSF_ADMIN,
        Role.HSF_LOAN_OFFICER,
      ],
    },
    {
      name: ReviewRequestStageKind.LenderConditionPrecendentReview,
      roles: [Role.LENDER_ADMIN, Role.LENDER_LOAN_OFFICER],
    },
  ]

  for (const stageData of conditionPrecedentReviewStagesData) {
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
    .where({ request_type_id: conditionPrecedentRequestType.id })
  console.log(
    `Disabled existing stages for request_type_id: ${conditionPrecedentRequestType.id}`,
  )

  for (const [
    index,
    stageData,
  ] of conditionPrecedentReviewStagesData.entries()) {
    const order = index + 1
    if (!stageData.id) {
      throw new Error(`Stage ID is missing for stage ${stageData.name}`)
    }

    console.log(
      `Processing stage: ${stageData.name} (ID: ${stageData.id}) for request_type_id: ${conditionPrecedentRequestType.id} with order ${order}`,
    )

    let [reviewRequestTypeStageEntry] = await knex
      .table<ReviewRequestTypeStage>('review_request_type_stages')
      .select()
      .where({
        request_type_id: conditionPrecedentRequestType.id,
        stage_id: stageData.id!,
      })
      .returning('*')

    if (!reviewRequestTypeStageEntry) {
      ;[reviewRequestTypeStageEntry] = await knex
        .table<ReviewRequestTypeStage>('review_request_type_stages')
        .insert({
          stage_order: order,
          enabled: true,
          request_type_id: conditionPrecedentRequestType.id,
          stage_id: stageData.id!,
        })
        .returning('*')
    } else {
      ;[reviewRequestTypeStageEntry] = await knex
        .table<ReviewRequestTypeStage>('review_request_type_stages')
        .update({
          stage_order: order,
          enabled: true,
          request_type_id: conditionPrecedentRequestType.id,
          stage_id: stageData.id!,
        })
        .where({ id: reviewRequestTypeStageEntry.id })
        .returning('*')
    }

    if (!reviewRequestTypeStageEntry) {
      throw new Error(
        `Failed to upsert review_request_type_stage for stage_id ${stageData.id} and request_type_id ${conditionPrecedentRequestType.id}`,
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
