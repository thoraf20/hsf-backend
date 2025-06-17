import { Knex } from 'knex'
import { v4 as uuidv4 } from 'uuid'
import {
  DocumentGroupKind as DocumentGroupEnum,
  DeveloperVerificationDocType,
  MortgageUploadDocType,
  ConditionPrecedentDocType,
  PropertyReportDocType,
  LoanAgreementType,
} from '../../src/domain/enums/documentEnum'
import { UserRole } from '../../src/domain/entities/User'
import { Role } from '../../src/domain/enums/rolesEmun'

export async function seed(knex: Knex): Promise<void> {
  // Use transactional seeding for safety
  await knex.transaction(async (trx) => {
    console.log('Starting document table seeding process...')

    // Get required role IDs
    const roleIds = await getRoleIds(trx)
    // Seed Document Groups first
    const groupIds = await seedDocumentGroups(trx)

    // Seed Group Document Types, using the IDs from the seeded groups and role IDs
    await seedGroupDocumentTypes(trx, groupIds, roleIds)
    console.log('Document table seeding process completed.')
  })
}

async function getRoleIds(trx: Knex.Transaction) {
  const [developerAdminRole, hsfAdminRole, homeBuyerRole, lenderAdminRole] =
    await Promise.all([
      trx<UserRole>('roles').where({ name: Role.DEVELOPER_ADMIN }).first(),
      trx<UserRole>('roles').where({ name: Role.HSF_ADMIN }).first(),
      trx<UserRole>('roles').where({ name: Role.HOME_BUYER }).first(),
      trx<UserRole>('roles').where({ name: Role.LENDER_ADMIN }).first(),
    ])

  if (!developerAdminRole)
    console.warn(
      'DEVELOPER_ADMIN role not found. GroupDocumentTypes depending on it will have null uploaded_by_role_id.',
    )
  if (!hsfAdminRole)
    console.warn(
      'HSF_ADMIN role not found. GroupDocumentTypes depending on it will have null uploaded_by_role_id.',
    )
  if (!homeBuyerRole)
    console.warn(
      'HOMEBUYER role not found. GroupDocumentTypes depending on it will have null uploaded_by_role_id.',
    )

  if (!lenderAdminRole)
    console.warn(
      'Lender Admin role not found. GroupDocumentTypes depending on it will have null uploaded_by_role_id.',
    )

  return { developerAdminRole, hsfAdminRole, homeBuyerRole, lenderAdminRole }
}

type AllowedRoles = Awaited<ReturnType<typeof getRoleIds>>

async function seedDocumentGroups(
  trx: Knex.Transaction,
): Promise<{ [key in DocumentGroupEnum]: string }> {
  console.log('Seeding Document Groups...')

  const groupsToSeed = [
    {
      tag: DocumentGroupEnum.DeveloperVerification,
      name: 'Developer Verification Documents',
      description: 'Documents required for developer verification.',
    },
    {
      tag: DocumentGroupEnum.ConditionPrecedent,
      name: 'Condition Precedent Documents',
      description: 'Documents required to fulfill loan conditions precedent.',
    },
    {
      tag: DocumentGroupEnum.MortgageUpload,
      name: 'Mortgage Upload Documents',
      description: 'Documents required for mortgage application uploads.',
    },

    {
      tag: DocumentGroupEnum.PropertyReport,
      name: 'Property Document',
      description:
        'Documents required to verification the authenicity of the property',
    },

    {
      tag: DocumentGroupEnum.LoanAgreement,
      name: 'Loan Agreement',
      description:
        'Documents related to the loan agreement and financing terms for the property purchase',
    },
  ]

  const groupIds: { [key in DocumentGroupEnum]: string } = {} as any

  for (const groupData of groupsToSeed) {
    const existingGroup = await trx('document_groups')
      .where({ tag: groupData.tag })
      .first()

    if (existingGroup) {
      console.log(
        `Document Group '${groupData.name}' already exists. Skipping creation.`,
      )
      groupIds[groupData.tag] = existingGroup.id
    } else {
      console.log(`Creating Document Group: '${groupData.name}'`)
      const [newGroup] = await trx('document_groups')
        .insert({
          id: uuidv4(),
          ...groupData,
        })
        .returning('id')
      groupIds[groupData.tag] = newGroup.id
      console.log(`Created Document Group with ID: ${groupIds[groupData.tag]}`)
    }
  }

  console.log('Finished seeding Document Groups.')
  return groupIds
}

// Function to seed Group Document Types
async function seedGroupDocumentTypes(
  trx: Knex.Transaction,
  groupIds: { [key: string]: string },
  roleIds: AllowedRoles,
): Promise<void> {
  console.log('Seeding Group Document Types...')

  const groupDocumentTypesToSeed = [
    // Developer Verification Doc Types
    {
      group_id: groupIds[DocumentGroupEnum.DeveloperVerification],
      document_type: DeveloperVerificationDocType.ApplicationLetterSigned,
      display_label: 'Signed Application Letter',
      is_user_uploadable: true,
      uploaded_by_role_id: roleIds.developerAdminRole?.id || null,
      is_required_for_group: true,
    },
    {
      group_id: groupIds[DocumentGroupEnum.DeveloperVerification],
      document_type: DeveloperVerificationDocType.CAC,
      display_label: 'CAC Registration Documents',
      is_user_uploadable: true,
      uploaded_by_role_id: roleIds.developerAdminRole?.id || null,
      is_required_for_group: true,
    },
    {
      group_id: groupIds[DocumentGroupEnum.DeveloperVerification],
      document_type:
        DeveloperVerificationDocType.MemorandumAndArticlesOfAssociation,
      display_label: 'Memorandum and Articles of Association',
      is_user_uploadable: true,
      uploaded_by_role_id: roleIds.developerAdminRole?.id || null,
      is_required_for_group: false,
    },
    {
      group_id: groupIds[DocumentGroupEnum.DeveloperVerification],
      document_type: DeveloperVerificationDocType.CompanyFinancialBankStatement,
      display_label: 'Company Financial/Bank Statement',
      is_user_uploadable: true,
      uploaded_by_role_id: roleIds.developerAdminRole?.id || null,
      is_required_for_group: true,
    },
    {
      group_id: groupIds[DocumentGroupEnum.DeveloperVerification],
      document_type: DeveloperVerificationDocType.CompanyAuditFinancials,
      display_label: 'Company Audit Financials',
      is_user_uploadable: true,
      uploaded_by_role_id: roleIds.developerAdminRole?.id || null,
      is_required_for_group: false,
    },
    {
      group_id: groupIds[DocumentGroupEnum.DeveloperVerification],
      document_type: DeveloperVerificationDocType.TaxCertificate,
      display_label: 'Tax Certificate',
      is_user_uploadable: true,
      uploaded_by_role_id: roleIds.developerAdminRole?.id || null,
      is_required_for_group: true,
    },
    {
      group_id: groupIds[DocumentGroupEnum.DeveloperVerification],
      document_type: DeveloperVerificationDocType.PropertySurveyAndTitle,
      display_label: 'Property Survey and Title',
      is_user_uploadable: true,
      uploaded_by_role_id: roleIds.developerAdminRole?.id || null,
      is_required_for_group: true,
    },
    {
      group_id: groupIds[DocumentGroupEnum.DeveloperVerification],
      document_type: DeveloperVerificationDocType.BillOfQuantity,
      display_label: 'Bill Of Quantity',
      is_user_uploadable: true,
      uploaded_by_role_id: roleIds.developerAdminRole?.id || null,
      is_required_for_group: true,
    },
    {
      group_id: groupIds[DocumentGroupEnum.DeveloperVerification],
      document_type:
        DeveloperVerificationDocType.ConstructionContractorsAndServiceAgreements,
      display_label: 'Construction Contractors And Service Agreements',
      is_user_uploadable: true,
      uploaded_by_role_id: roleIds.developerAdminRole?.id || null,
      is_required_for_group: true,
    },
    {
      group_id: groupIds[DocumentGroupEnum.DeveloperVerification],
      document_type:
        DeveloperVerificationDocType.CashFlowProjectAndProfitabilityAnalysis,
      display_label: 'Cash Flow Project And Profitability Analysis',
      is_user_uploadable: true,
      uploaded_by_role_id: roleIds.developerAdminRole?.id || null,
      is_required_for_group: true,
    },
    {
      group_id: groupIds[DocumentGroupEnum.DeveloperVerification],
      document_type:
        DeveloperVerificationDocType.MarketingStrategyAndListOfOffTakers,
      display_label: 'Marketing Strategy And List Of Off-Takers',
      is_user_uploadable: true,
      uploaded_by_role_id: roleIds.developerAdminRole?.id || null,
      is_required_for_group: true,
    },
    {
      group_id: groupIds[DocumentGroupEnum.DeveloperVerification],
      document_type: DeveloperVerificationDocType.ProjectImplementationPlan,
      display_label: 'Project Implementation Plan',
      is_user_uploadable: true,
      uploaded_by_role_id: roleIds.developerAdminRole?.id || null,
      is_required_for_group: true,
    },
    {
      group_id: groupIds[DocumentGroupEnum.DeveloperVerification],
      document_type: DeveloperVerificationDocType.FundUtilizationPlan,
      display_label: 'Fund Utilization Plan',
      is_user_uploadable: true,
      uploaded_by_role_id: roleIds.developerAdminRole?.id || null,
      is_required_for_group: true,
    },

    // Condition Precedent Doc Types
    {
      group_id: groupIds[DocumentGroupEnum.ConditionPrecedent],
      document_type: ConditionPrecedentDocType.SignedLoanOfferLetter,
      display_label: 'Signed Loan Offer Letter',
      is_user_uploadable: true,
      uploaded_by_role_id: roleIds.homeBuyerRole?.id || null,
      is_required_for_group: true,
    },
    {
      group_id: groupIds[DocumentGroupEnum.ConditionPrecedent],
      document_type: ConditionPrecedentDocType.InsurancePaymentConfirmation,
      display_label: 'Insurance Payment Confirmation',
      is_user_uploadable: true,
      uploaded_by_role_id: roleIds.homeBuyerRole?.id || null,
      is_required_for_group: true,
    },
    {
      group_id: groupIds[DocumentGroupEnum.ConditionPrecedent],
      document_type: ConditionPrecedentDocType.FinalBankApproval,
      display_label: 'Final Bank Approval',
      is_user_uploadable: false,
      uploaded_by_role_id: roleIds.homeBuyerRole?.id || null,
      is_required_for_group: true,
    },
    {
      group_id: groupIds[DocumentGroupEnum.ConditionPrecedent],
      document_type: ConditionPrecedentDocType.LegalAndComplianceDocuments,
      display_label: 'Legal & Compliance Documents',
      is_user_uploadable: false,
      uploaded_by_role_id: roleIds.homeBuyerRole?.id || null, // Adjust role as needed
      is_required_for_group: true,
    },

    // Mortgage Upload Doc Types
    {
      group_id: groupIds[DocumentGroupEnum.MortgageUpload],
      document_type: MortgageUploadDocType.PassportPhotograph,
      display_label: 'Passport Photograph',
      is_user_uploadable: true,
      uploaded_by_role_id: roleIds.homeBuyerRole?.id || null,
      is_required_for_group: true,
    },
    {
      group_id: groupIds[DocumentGroupEnum.MortgageUpload],
      document_type: MortgageUploadDocType.LoanApplicationForm,
      display_label: 'Loan Application Form',
      is_user_uploadable: true,
      uploaded_by_role_id: roleIds.homeBuyerRole?.id || null,
      is_required_for_group: true,
    },
    {
      group_id: groupIds[DocumentGroupEnum.MortgageUpload],
      document_type: MortgageUploadDocType.LoanAgreement,
      display_label: 'Loan Agreement',
      is_user_uploadable: false,
      uploaded_by_role_id: roleIds.homeBuyerRole?.id || null, // Adjust role as needed
      is_required_for_group: true,
    },
    {
      group_id: groupIds[DocumentGroupEnum.MortgageUpload],
      document_type: MortgageUploadDocType.FireAndSpecialPerilsInsurance,
      display_label: 'Fire and Special Perils Insurance',
      is_user_uploadable: true,
      uploaded_by_role_id: roleIds.homeBuyerRole?.id || null,
      is_required_for_group: true,
    },
    {
      group_id: groupIds[DocumentGroupEnum.MortgageUpload],
      document_type: MortgageUploadDocType.RecentPaySlip,
      display_label: 'Recent Pay Slip',
      is_user_uploadable: true,
      uploaded_by_role_id: roleIds.homeBuyerRole?.id || null,
      is_required_for_group: true,
    },
    {
      group_id: groupIds[DocumentGroupEnum.MortgageUpload],
      document_type: MortgageUploadDocType.TaxReturn,
      display_label: 'Tax Return',
      is_user_uploadable: true,
      uploaded_by_role_id: roleIds.homeBuyerRole?.id || null,
      is_required_for_group: true,
    },
    {
      group_id: groupIds[DocumentGroupEnum.MortgageUpload],
      document_type: MortgageUploadDocType.EmploymentLetter,
      display_label: 'Employment Letter',
      is_user_uploadable: true,
      uploaded_by_role_id: roleIds.homeBuyerRole?.id || null,
      is_required_for_group: true,
    },
    {
      group_id: groupIds[DocumentGroupEnum.MortgageUpload],
      document_type: MortgageUploadDocType.EmploymentLetterOfIntroduction,
      display_label: 'Employment Letter of Introduction',
      is_user_uploadable: true,
      uploaded_by_role_id: roleIds.homeBuyerRole?.id || null,
      is_required_for_group: true,
    },
    {
      group_id: groupIds[DocumentGroupEnum.MortgageUpload],
      document_type: MortgageUploadDocType.BankStatements,
      display_label: 'Bank Statements',
      is_user_uploadable: true,
      uploaded_by_role_id: roleIds.homeBuyerRole?.id || null,
      is_required_for_group: true,
    },
    {
      group_id: groupIds[DocumentGroupEnum.MortgageUpload],
      document_type: MortgageUploadDocType.SixUndatedCheque,
      display_label: '6 Un-dated Cheque',
      is_user_uploadable: true,
      uploaded_by_role_id: roleIds.homeBuyerRole?.id || null,
      is_required_for_group: true,
    },

    // Property Report Doc Types
    {
      group_id: groupIds[DocumentGroupEnum.PropertyReport],
      document_type: PropertyReportDocType.LandReport,
      display_label: 'Land Report',
      is_user_uploadable: false, // Assuming HSF admin uploads these
      uploaded_by_role_id: roleIds.hsfAdminRole?.id || null, // Assuming HSF admin uploads these
      is_required_for_group: true, // Assuming they are required
    },
    {
      group_id: groupIds[DocumentGroupEnum.PropertyReport],
      document_type: PropertyReportDocType.VerificationReport,
      display_label: 'Verification Report',
      is_user_uploadable: false, // Assuming HSF admin uploads these
      uploaded_by_role_id: roleIds.hsfAdminRole?.id || null, // Assuming HSF admin uploads these
      is_required_for_group: true, // Assuming they are required
    },

    // Property Report Doc Types
    {
      group_id: groupIds[DocumentGroupEnum.LoanAgreement],
      document_type: LoanAgreementType.LenderSignedAgreementLetter,
      display_label: 'Lender Loan Agreement Signed Letter',
      is_user_uploadable: false, // Assuming Lender admin uploads these
      uploaded_by_role_id: roleIds.lenderAdminRole?.id || null, // Assuming HSF admin uploads these
      is_required_for_group: true, // Assuming they are required
    },
    {
      group_id: groupIds[DocumentGroupEnum.LoanAgreement],
      document_type: LoanAgreementType.BuyerSignedAgreementLetter,
      display_label: 'Buyer Loan Agreement Signed Letter',
      is_user_uploadable: true, // Assuming HomeBuyer admin uploads these
      uploaded_by_role_id: roleIds.homeBuyerRole?.id || null, // Assuming HSF admin uploads these
      is_required_for_group: true, // Assuming they are required
    },
  ]

  for (const docTypeData of groupDocumentTypesToSeed) {
    if (!docTypeData.group_id) {
      console.warn(
        `Skipping seeding document type '${docTypeData.document_type}': Corresponding group not found.`,
      )
      continue
    }

    const existingDocType = await trx('group_document_types')
      .where({
        group_id: docTypeData.group_id,
        document_type: docTypeData.document_type,
      })
      .first()

    if (existingDocType) {
      console.log(
        `Group Document Type '${docTypeData.document_type}' for group ID '${docTypeData.group_id}' already exists. Skipping creation.`,
      )
    } else {
      console.log(
        `Creating Group Document Type: '${docTypeData.document_type}' for group ID '${docTypeData.group_id}'`,
      )
      await trx('group_document_types').insert({
        id: uuidv4(),
        ...docTypeData,
      })
    }
  }

  console.log('Finished seeding Group Document Types.')
}
