import { LoanAgreement } from '@domain/entities/Loans'
import { ILoanAgreementRepository } from '@interfaces/ILoanAgreementRepository'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { StatusCodes } from 'http-status-codes'
import { LoanAgreementFilters } from '@validators/loanAgreementValidator'
import { ILoanOfferRepository } from '@interfaces/ILoanOfferRepository'
import { IOrganizationRepository } from '@interfaces/IOrganizationRepository'
import { ILoanRepository } from '@interfaces/ILoanRepository'
import { IApplicationRespository } from '@interfaces/IApplicationRespository'
import { Application } from '@entities/Application'
import { IUserRepository } from '@interfaces/IUserRepository'
import { getUserClientView } from '@entities/User'

export class ManageLoanAgreementService {
  constructor(
    private readonly loanAgreementRepository: ILoanAgreementRepository,
    private readonly loanRepository: ILoanRepository,
    private readonly loanOfferRepository: ILoanOfferRepository,
    private readonly organizationRepository: IOrganizationRepository,
    private readonly applicationRepository: IApplicationRespository,
    private readonly userRepository: IUserRepository,
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

    return {
      ...loanAgreement,
      application,
      loan_offer: loanOffer,
      user: user ? getUserClientView(user) : null,

      lender_org,
      loan,
    }
  }

  // async createLoanAgreement(
  //   loanAgreement: LoanAgreement,
  // ): Promise<LoanAgreement> {
  //   // Add any business logic here before creating the loan agreement
  //   // For example, you might want to check if the associated loan offer exists

  //   const newLoanAgreement =
  //     await this.loanAgreementRepository.createLoanAgreement(loanAgreement)
  //   return newLoanAgreement
  // }

  async updateLoanAgreement(
    loanAgreementId: string,
    loanAgreement: Partial<LoanAgreement>,
    /*authInfo: AuthInfo, // Consider using AuthInfo for authorization */
  ): Promise<LoanAgreement | null> {
    const existingLoanAgreement =
      await this.loanAgreementRepository.getLoanAgreementById(loanAgreementId)

    if (!existingLoanAgreement) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Loan agreement not found',
      )
    }

    const updatedLoanAgreement =
      await this.loanAgreementRepository.updateLoanAgreement(
        loanAgreementId,
        loanAgreement,
      )

    return updatedLoanAgreement
  }

  // async deleteLoanAgreement(loanAgreementId: string): Promise<void> {
  //   const existingLoanAgreement =
  //     await this.loanAgreementRepository.getLoanAgreementById(loanAgreementId)

  //   if (!existingLoanAgreement) {
  //     throw new ApplicationCustomError(
  //       StatusCodes.NOT_FOUND,
  //       'Loan agreement not found',
  //     )
  //   }

  //   // Add any business logic or authorization checks here before deleting
  //   // For example, you might want to check if the user has permission to delete the loan agreement

  //   await this.loanAgreementRepository.deleteLoanAgreement(loanAgreementId)
  // }
}
