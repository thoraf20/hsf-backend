import { createResponse } from '@presentation/response/responseType'
import { StatusCodes } from 'http-status-codes'
import {
  LoanAgreementFilters,
  SetLoanAgreementLetterInput,
} from '@validators/loanAgreementValidator'
import { AuthInfo } from '@shared/utils/permission-policy'
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

  async setLoanAgreementLetter(
    loanAgreementId: string,
    input: SetLoanAgreementLetterInput,
    authInfo: AuthInfo,
  ) {
    const response =
      await this.manageLoanAgreementService.setLoanAgreementLetter(
        loanAgreementId,
        input,
        authInfo,
      )

    return createResponse(
      StatusCodes.OK,
      !response.lender_signature_doc_id
        ? 'Loan agreement letter removed successfully'
        : 'Loan agreement letter set successfully',
    )
  }
}
