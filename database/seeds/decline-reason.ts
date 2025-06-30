import { Knex } from 'knex'
import { DeclineReasonCategory } from '../../src/domain/enums/declineReasonCategoryEnum'

const declineReasons = [
  // Loan Decline Reasons (LOAN category) - Merged with user's specific requests
  {
    value: 'LOW_CREDIT_SCORE',
    label: 'Low Credit Score',
    description:
      'Applicant credit score does not meet the minimum requirements.',
    category: DeclineReasonCategory.Loan,
  },
  {
    value: 'INSUFFICIENT_INCOME',
    label: 'Insufficient Income',
    description: 'Applicant income does not meet the required threshold.',
    category: DeclineReasonCategory.Loan,
  },
  {
    value: 'HIGH_DEBT_TO_INCOME_RATIO',
    label: 'High Debt-to-Income Ratio',
    description: 'Applicant debt-to-income ratio exceeds acceptable limits.',
    category: DeclineReasonCategory.Loan,
  },
  {
    value: 'UNSTABLE_EMPLOYMENT_HISTORY',
    label: 'Unstable Employment History',
    description: 'Applicant lacks a stable or verifiable employment history.',
    category: DeclineReasonCategory.Loan,
  },
  {
    value: 'RECENT_BANKRUPTCY',
    label: 'Recent Bankruptcy',
    description: 'Applicant has a recent bankruptcy on their financial record.',
    category: DeclineReasonCategory.Loan,
  },
  {
    value: 'PREVIOUS_FORECLOSURE',
    label: 'Previous Foreclosure',
    description: 'Applicant has a history of property foreclosure.',
    category: DeclineReasonCategory.Loan,
  },
  {
    value: 'INCOMPLETE_LOAN_APPLICATION',
    label: 'Incomplete Loan Application',
    description:
      'Required fields or sections of the loan application were not completed.',
    category: DeclineReasonCategory.Loan,
  },
  {
    value: 'IDENTIFICATION_VERIFICATION_ISSUES',
    label: 'Identification Verification Issues',
    description: 'Problems encountered during identity verification process.',
    category: DeclineReasonCategory.Loan,
  },
  {
    value: 'LOAN_PURPOSE_UNACCEPTABLE',
    label: 'Loan Purpose Unacceptable',
    description:
      'The stated purpose for the loan is not acceptable under current policies.',
    category: DeclineReasonCategory.Loan,
  },
  {
    value: 'LOAN_AMOUNT_EXCEEDS_PROPERTY_VALUE',
    label: 'Loan Amount Exceeds Property Value',
    description:
      'Requested loan amount is higher than the appraised property value.',
    category: DeclineReasonCategory.Loan,
  },

  // Document Decline Reasons (DOCUMENT category) - Merged with user's specific requests
  {
    value: 'UNREADABLE_DOCUMENT_SCAN',
    label: 'Document is Unreadable/Poor Quality',
    description: 'Document scan is blurry, unclear, or unreadable.',
    category: DeclineReasonCategory.Document,
  },
  {
    value: 'MISSING_REQUIRED_INFORMATION',
    label: 'Missing Required Information in Document',
    description: 'The document lacks crucial information or details.',
    category: DeclineReasonCategory.Document,
  },
  {
    value: 'INCORRECT_DOCUMENT_UPLOADED',
    label: 'Incorrect Document Uploaded',
    description: 'An incorrect document was submitted for the required type.',
    category: DeclineReasonCategory.Document,
  },
  {
    value: 'OUTDATED_OR_EXPIRED_DOCUMENT',
    label: 'Document is Outdated/Expired',
    description: 'The provided document has passed its expiration date.',
    category: DeclineReasonCategory.Document,
  },
  {
    value: 'TAMPERED_DOCUMENT',
    label: 'Document Appears Altered or Tampered',
    description: 'Document shows signs of alteration or tampering.',
    category: DeclineReasonCategory.Document,
  },
  {
    value: 'MISSING_SIGNATURE',
    label: 'Required Signature is Missing',
    description: 'A required signature is absent from the document.',
    category: DeclineReasonCategory.Document,
  },
  {
    value: 'DETAILS_MISMATCH_WITH_APPLICATION',
    label: 'Details Mismatch with Application',
    description:
      'Information on the document does not match other provided application data.',
    category: DeclineReasonCategory.Document,
  },
  {
    value: 'NOT_FROM_OFFICIAL_SOURCE',
    label: 'Not from an Official Source',
    description:
      'The document was not issued by a verifiable or official source.',
    category: DeclineReasonCategory.Document,
  },
  {
    value: 'INCOMPLETE_PAGES',
    label: 'Incomplete Pages/Sections',
    description: 'The document provided is missing some pages or sections.',
    category: DeclineReasonCategory.Document,
  },
  {
    value: 'INCORRECT_FORMAT_FILE_TYPE',
    label: 'Incorrect Format/File Type',
    description:
      'The document was uploaded in an unsupported format or file type.',
    category: DeclineReasonCategory.Document,
  },
  {
    value: 'DOCUMENT_DUPLICATE_SUBMISSION',
    label: 'Duplicate Document Submission',
    description:
      'This document has already been submitted for this or another relevant entry.',
    category: DeclineReasonCategory.Document,
  },

  // Property-related Decline Reasons (PROPERTY category)
  {
    value: 'PROPERTY_DOES_NOT_MEET_CRITERIA',
    label: 'Property Does Not Meet Criteria',
    description:
      'The property does not satisfy the set eligibility criteria (e.g., location, type).',
    category: DeclineReasonCategory.Property,
  },
  {
    value: 'NEGATIVE_PROPERTY_REPORT',
    label: 'Negative Property Report',
    description:
      'Inspection or appraisal report indicates significant issues with the property.',
    category: DeclineReasonCategory.Property,
  },

  // Eligibility Decline Reasons (ELIGIBILITY category)
  {
    value: 'DOES_NOT_MEET_ELIGIBILITY_CRITERIA',
    label: 'Does Not Meet Eligibility Criteria',
    description:
      'Applicant does not meet the basic eligibility requirements for the product/service.',
    category: DeclineReasonCategory.Eligibility,
  },

  // Application Decline Reasons (APPLICATION category)
  {
    value: 'DUPLICATE_APPLICATION',
    label: 'Duplicate Application',
    description: 'This application is a duplicate of an existing one.',
    category: DeclineReasonCategory.Application,
  },
  {
    value: 'LATE_SUBMISSION',
    label: 'Late Submission',
    description:
      'Application or required documents were submitted past the deadline.',
    category: DeclineReasonCategory.Application,
  },
]

export async function seed(knex: Knex): Promise<void> {
  console.log('Starting decline reasons seeding process...')

  for (const reason of declineReasons) {
    const existingReason = await knex('decline_reasons')
      .where('value', reason.value)
      .first()

    if (existingReason) {
      console.log(`Decline reason '${reason.label}' already exists. Updating.`)
      await knex('decline_reasons')
        .where('value', reason.value)
        .update({
          label: reason.label,
          description: reason.description || null,
          category: reason.category,
          updated_at: knex.fn.now(),
        })
    } else {
      console.log(`Inserting decline reason: '${reason.label}'`)
      await knex('decline_reasons').insert({
        value: reason.value,
        label: reason.label,
        description: reason.description || null,
        category: reason.category,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      })
    }
  }
  console.log('Decline reasons seeding process completed.')
}
