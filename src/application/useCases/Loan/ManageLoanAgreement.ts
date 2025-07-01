import { ILoanAgreementRepository } from '@interfaces/ILoanAgreementRepository'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { StatusCodes } from 'http-status-codes'
import {
  ApproveLenderLoanAgreementInput,
  LoanAgreementFilters,
  SetLoanAgreementLetterInput,
} from '@validators/loanAgreementValidator'
import { ILoanOfferRepository } from '@interfaces/ILoanOfferRepository'
import { IOrganizationRepository } from '@interfaces/IOrganizationRepository'
import { ILoanRepository } from '@interfaces/ILoanRepository'
import { IApplicationRespository } from '@interfaces/IApplicationRespository'
import { Application } from '@entities/Application'
import { IUserRepository } from '@interfaces/IUserRepository'
import { getUserClientView } from '@entities/User'
import { AuthInfo } from '@shared/utils/permission-policy'
import { IDocumentRepository } from '@interfaces/IDocumentRepository'
import {
  DocumentGroupKind,
  LoanAgreementType,
} from '@domain/enums/documentEnum'
import { runWithTransaction } from '@infrastructure/database/knex'
import { ApplicationDocumentEntry } from '@entities/ApplicationDocuments'
import { LoanAgreementStatus } from '@domain/enums/loanEnum'

export class ManageLoanAgreementService {
  constructor(
    private readonly loanAgreementRepository: ILoanAgreementRepository,
    private readonly loanRepository: ILoanRepository,
    private readonly loanOfferRepository: ILoanOfferRepository,
    private readonly organizationRepository: IOrganizationRepository,
    private readonly applicationRepository: IApplicationRespository,
    private readonly userRepository: IUserRepository,
    private readonly documentRepository: IDocumentRepository,
  ) {}

  async getLoanAgreements(filters: LoanAgreementFilters) {
    const loanAgreementsContent =
      await this.loanAgreementRepository.getLoanAgreements(filters)

    loanAgreementsContent.result = await Promise.all(
      loanAgreementsContent.result.map(async (agreement) => {
        const loanOffer = await this.loanOfferRepository.getLoanOfferById(
          agreement.loan_offer_id,
        )

        const lender_org =
          await this.organizationRepository.getOrganizationById(
            agreement.lender_org_id,
          )

        let loan = await this.loanRepository.getLoanByOfferId(
          agreement.loan_offer_id,
        )

        let application: Application | null = null

        if (agreement.application_id) {
          application = await this.applicationRepository.getApplicationById(
            agreement.application_id,
          )
        }

        let user = await this.userRepository.findById(agreement.user_id)

        return {
          ...agreement,
          application,
          loan_offer: loanOffer,
          lender_org,
          user: user ? getUserClientView(user) : null,
          loan,
        }
      }),
    )
    return loanAgreementsContent
  }

  async getLoanAgreementById(loanAgreementId: string) {
    const loanAgreement =
      await this.loanAgreementRepository.getLoanAgreementById(loanAgreementId)

    if (!loanAgreement) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Loan agreement not found',
      )
    }

    const loanOffer = await this.loanOfferRepository.getLoanOfferById(
      loanAgreement.loan_offer_id,
    )

    const lender_org = await this.organizationRepository.getOrganizationById(
      loanAgreement.lender_org_id,
    )

    let loan = await this.loanRepository.getLoanByOfferId(
      loanAgreement.loan_offer_id,
    )

    let application: Application | null = null

    if (loanAgreement.application_id) {
      application = await this.applicationRepository.getApplicationById(
        loanAgreement.application_id,
      )
    }

    let user = await this.userRepository.findById(loanAgreement.user_id)

    let lenderSignatureDoc: ApplicationDocumentEntry | null = null

    if (loanAgreement.lender_signature_doc_id) {
      lenderSignatureDoc =
        await this.documentRepository.findApplicationDocumentEntryById(
          loanAgreement.lender_signature_doc_id,
        )

      if (lenderSignatureDoc) {
        lenderSignatureDoc.document_group_type =
          await this.documentRepository.findGroupDocumentTypeById(
            lenderSignatureDoc.document_group_type_id,
          )

        if (lenderSignatureDoc.uploaded_by_id) {
          const lenderSignatureUplaodedBy = await this.userRepository.findById(
            lenderSignatureDoc.uploaded_by_id,
          )

          lenderSignatureDoc.uploaded_by = lenderSignatureUplaodedBy
            ? getUserClientView(lenderSignatureUplaodedBy)
            : null
        }
      }
    }

    let borrowerSignatureDoc: ApplicationDocumentEntry | null = null

    if (loanAgreement.borrower_signature_doc_id) {
      borrowerSignatureDoc =
        await this.documentRepository.findApplicationDocumentEntryById(
          loanAgreement.borrower_signature_doc_id,
        )

      if (borrowerSignatureDoc) {
        borrowerSignatureDoc.document_group_type =
          await this.documentRepository.findGroupDocumentTypeById(
            lenderSignatureDoc.document_group_type_id,
          )

        if (borrowerSignatureDoc.uploaded_by_id) {
          const borrowerSignatureUploadedBy =
            await this.userRepository.findById(
              borrowerSignatureDoc.uploaded_by_id,
            )

          borrowerSignatureDoc.uploaded_by = borrowerSignatureUploadedBy
            ? getUserClientView(borrowerSignatureUploadedBy)
            : null
        }
      }
    }

    return {
      ...loanAgreement,
      application,
      loan_offer: loanOffer,
      user: user ? getUserClientView(user) : null,
      lender_signature_doc: lenderSignatureDoc,
      borrower_signature_doc: borrowerSignatureDoc,
      lender_org,
      loan,
    }
  }

  async setLoanAgreementLetter(
    loanAgreementId: string,
    input: SetLoanAgreementLetterInput,
    authInfo: AuthInfo,
  ) {
    const existingLoanAgreement =
      await this.loanAgreementRepository.getLoanAgreementById(loanAgreementId)
    if (
      !(
        existingLoanAgreement &&
        existingLoanAgreement.lender_org_id === authInfo.currentOrganizationId
      )
    ) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Loan agreement not found or you do not have permission to access it',
      )
    }

    if (!(input.document || existingLoanAgreement.lender_signature_doc_id)) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Lender Loan agreement already revoked',
      )
    }

    const loanAgreementDocGroup =
      await this.documentRepository.findDocumentGroupByTag(
        DocumentGroupKind.LoanAgreement,
      )
    if (!loanAgreementDocGroup) {
      throw new ApplicationCustomError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Loan agreement document group not found or not properly configured',
      )
    }

    const loanAgreementDocGroupTypes =
      await this.documentRepository.findGroupDocumentTypesByGroupId(
        loanAgreementDocGroup.id,
      )
    if (
      !loanAgreementDocGroupTypes ||
      loanAgreementDocGroupTypes.length === 0
    ) {
      throw new ApplicationCustomError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Document group types not found or not properly configured',
      )
    }

    const lenderPartnerAgreementGroupType = loanAgreementDocGroupTypes.find(
      (groupType) =>
        groupType.document_type ===
        LoanAgreementType.LenderSignedAgreementLetter,
    )
    if (!lenderPartnerAgreementGroupType) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'You are not authorized to upload lender signed agreement letters for this loan agreement',
      )
    }

    return runWithTransaction(async () => {
      try {
        if (!input.document) {
          const [, updateLoanAgreement] = await Promise.all([
            this.documentRepository.deleteApplicationDocumentEntry(
              existingLoanAgreement.lender_signature_doc_id,
            ),
            this.loanAgreementRepository.updateLoanAgreement(
              existingLoanAgreement.id,
              {
                lender_sign_uploaded_at: null,
                lender_signature_doc_id: null,
                status: LoanAgreementStatus.Draft,
              },
            ),
          ])

          return updateLoanAgreement
        }

        const lenderSignatureDoc =
          await this.documentRepository.createApplicationDocumentEntry({
            document_url: input.document.url,
            document_size:
              typeof input.document.size === 'number'
                ? input.document.size.toString()
                : null,
            document_group_type_id: lenderPartnerAgreementGroupType.id,
            application_id: input.application_id,
            document_name:
              input.document?.name ??
              lenderPartnerAgreementGroupType.document_type.toLowerCase(),
            user_id: existingLoanAgreement.user_id,
            uploaded_by_id: authInfo.userId,
            uploaded_at: new Date(),
          })

        const loanAgreement =
          await this.loanAgreementRepository.updateLoanAgreement(
            existingLoanAgreement.id,
            {
              lender_sign_uploaded_at: new Date(),
              lender_signature_doc_id: lenderSignatureDoc.id,
              status: LoanAgreementStatus.PendingApproval,
            },
          )

        return {
          ...loanAgreement,
          lender_signature_doc: lenderSignatureDoc,
        }
      } catch (error) {
        throw new ApplicationCustomError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          'Failed to save loan agreement letter. Please try again.',
        )
      }
    })
  }

  async approveLenderLoanAgreement(
    loanAgreementId: string,
    input: ApproveLenderLoanAgreementInput,
    authInfo: AuthInfo,
  ) {
    const loanAgreement =
      await this.loanAgreementRepository.getLoanAgreementById(loanAgreementId)

    if (!loanAgreement) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Loan agreement not found.',
      )
    }

    if (loanAgreement.status !== LoanAgreementStatus.PendingApproval) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Loan agreement is not pending approval.',
      )
    }

    const updatedLoanAgreement =
      await this.loanAgreementRepository.updateLoanAgreement(loanAgreement.id, {
        status: LoanAgreementStatus.BorrowerSignAndUploadPending,
        borrower_signature_doc_id: null,
        borower_sign_uploaded_at: null,
      })

    return updatedLoanAgreement
  }
}
