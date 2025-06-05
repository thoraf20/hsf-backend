import { OrganizationType } from '@domain/enums/organizationEnum'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { createResponse } from '@presentation/response/responseType'
import { Role } from '@routes/index.t'
import { AuthInfo } from '@shared/utils/permission-policy'
import { ManageLoanOfferService } from '@use-cases/Loan/ManageLoanOffer'
import {
  SetLoanOfferWorkflowStatusInput,
  UpdateLoanOfferInput,
} from '@validators/loanOfferValidator'
import { LoanOfferFilters } from '@validators/loanValidator'
import { StatusCodes } from 'http-status-codes'

export class ManageLoanOfferController {
  constructor(
    private readonly manageLoanOfferService: ManageLoanOfferService,
  ) {}

  async getLoanOffers(filters: LoanOfferFilters, authInfo: AuthInfo) {
    if (authInfo.organizationType === OrganizationType.LENDER_INSTITUTION) {
      filters.lender_org_id = authInfo.currentOrganizationId
    }

    const loanOfferContents =
      await this.manageLoanOfferService.getLoanOffers(filters)

    return createResponse(
      StatusCodes.OK,
      'Loan offers retrieved successfully',
      loanOfferContents,
    )
  }

  async getLoanById(loanOfferId: string, authInfo: AuthInfo) {
    const loanOffer =
      await this.manageLoanOfferService.getLoanOfferById(loanOfferId)

    if (
      !(
        loanOffer &&
        (authInfo.globalRole !== Role.HOME_BUYER ||
          authInfo.userId === loanOffer.user_id)
      )
    ) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Loan offer not found',
      )
    }

    return createResponse(
      StatusCodes.OK,
      'Loan offer retrieved successfully',
      loanOffer,
    )
  }

  async updateLoanOffer(
    loanOfferId: string,
    input: UpdateLoanOfferInput,
    authInfo: AuthInfo,
  ) {
    const updatedLoanOffer = await this.manageLoanOfferService.updateLoanOffer(
      loanOfferId,
      input,
      authInfo,
    )

    return createResponse(
      StatusCodes.OK,
      'Loan offer updated succesfully',
      updatedLoanOffer,
    )
  }

  async updateLoanOfferWorkflow(
    loanOfferId: string,
    input: SetLoanOfferWorkflowStatusInput,
    authInfo: AuthInfo,
  ) {
    const updatedLoanOffer =
      await this.manageLoanOfferService.updateLoanOfferWorkflow(
        loanOfferId,
        input,
        authInfo,
      )

    return createResponse(
      StatusCodes.OK,
      `Loan offer workflow status set as ${updatedLoanOffer.workflow_status} succesfully`,
      updatedLoanOffer,
    )
  }
}
