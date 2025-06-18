import { createResponse } from '@presentation/response/responseType'
import { StatusCodes } from 'http-status-codes'
import { LoanAgreementFilters } from '@validators/loanAgreementValidator'
import { AuthInfo } from '@shared/utils/permission-policy'
import { LoanAgreement } from '@domain/entities/Loans'
import { ManageLoanAgreementService } from '@use-cases/Loan/ManageLoanAgreement'
import { Role } from '@routes/index.t'
import { ApplicationCustomError } from '@middleware/errors/customError'

export class ManageLoanAgreementController {
  constructor(
    private readonly manageLoanAgreementService: ManageLoanAgreementService,
  ) {}

  async getLoanAgreements(filters: LoanAgreementFilters) {
    const loanAgreementsContent =
      await this.manageLoanAgreementService.getLoanAgreements(filters)

    return createResponse(
      StatusCodes.OK,
      'Loan agreements retrieved successfully',
      loanAgreementsContent,
    )
  }

  async getLoanAgreementById(loanAgreementId: string, authInfo: AuthInfo) {
    const loanAgreement =
      await this.manageLoanAgreementService.getLoanAgreementById(
        loanAgreementId,
      )

    if (
      !(
        loanAgreement &&
        (authInfo.globalRole !== Role.HOME_BUYER ||
          authInfo.userId === loanAgreement.user_id)
      )
    ) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Loan agreement not found',
      )
    }

    return createResponse(
      StatusCodes.OK,
      'Loan agreement retrieved successfully',
      loanAgreement,
    )
  }

  // async createLoanAgreement(
  //   loanAgreement: LoanAgreement /*, authInfo: AuthInfo*/,
  // ) {
  //   const newLoanAgreement =
  //     await this.manageLoanAgreementService.createLoanAgreement(loanAgreement)

  //   return createResponse(
  //     StatusCodes.CREATED,
  //     'Loan agreement created successfully',
  //     newLoanAgreement,
  //   )
  // }

  async updateLoanAgreement(
    loanAgreementId: string,
    loanAgreement: Partial<LoanAgreement>,
    /*authInfo: AuthInfo,*/
  ) {
    const updatedLoanAgreement =
      await this.manageLoanAgreementService.updateLoanAgreement(
        loanAgreementId,
        loanAgreement,
        /* authInfo,*/
      )

    return createResponse(
      StatusCodes.OK,
      'Loan agreement updated successfully',
      updatedLoanAgreement,
    )
  }

  // async deleteLoanAgreement(loanAgreementId: string /*, authInfo: AuthInfo*/) {
  //   await this.manageLoanAgreementService.deleteLoanAgreement(loanAgreementId)

  //   return createResponse(
  //     StatusCodes.NO_CONTENT,
  //     'Loan agreement deleted successfully',
  //     null,
  //   )
  // }
}
