import { OrganizationType } from '@domain/enums/organizationEnum'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { createResponse } from '@presentation/response/responseType'
import { Role } from '@routes/index.t'
import { AuthInfo } from '@shared/utils/permission-policy'
import { ManageLoanOfferService } from '@use-cases/Loan/ManageLoanOffer'
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

    console.log(loanOffer)
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
}
