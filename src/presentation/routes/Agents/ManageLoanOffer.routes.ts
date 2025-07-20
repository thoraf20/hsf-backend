import { ManageLoanOfferController } from '@controllers/Agent/ManageLoanOffer.controller'
import { OrganizationType } from '@domain/enums/organizationEnum'
import { authorize } from '@middleware/authorization'
import { LenderRepository } from '@repositories/Agents/LenderRepository'
// import { LoanAgreementRepository } from '@repositories/loans/LoanAgreementRepository'
import { LoanOfferRepository } from '@repositories/loans/LoanOfferRepository'
import { OrganizationRepository } from '@repositories/OrganizationRepository'
import { ApplicationRepository } from '@repositories/property/ApplicationRepository'
import { UserRepository } from '@repositories/user/UserRepository'
import { asyncMiddleware, validateRequest } from '@routes/index.t'
import { validateRequestQuery } from '@shared/utils/paginate'
import { requireOrganizationType } from '@shared/utils/permission-policy'
import { ManageLoanOfferService } from '@use-cases/Loan/ManageLoanOffer'
import {
  setLoanOfferWorkflowStatusSchema,
  updateLoanOfferSchema,
} from '@validators/loanOfferValidator'
import { loanOfferFiltersSchema } from '@validators/loanValidator'
import { Router } from 'express'

const manageLoanOfferRoutes = Router()

const manageLoanOfferSevice = new ManageLoanOfferService(
  new LoanOfferRepository(),
  new UserRepository(),
  new OrganizationRepository(),
  new ApplicationRepository(),
  // new LoanAgreementRepository(),
  new LenderRepository(),
)

const manageLoanOfferController = new ManageLoanOfferController(
  manageLoanOfferSevice,
)

manageLoanOfferRoutes.get(
  '/loan-offers',
  validateRequestQuery(loanOfferFiltersSchema),
  authorize(
    requireOrganizationType(
      OrganizationType.HSF_INTERNAL,
      OrganizationType.LENDER_INSTITUTION,
    ),
  ),
  asyncMiddleware(async (req, res) => {
    const { query, authInfo } = req
    const response = await manageLoanOfferController.getLoanOffers(
      query,
      authInfo,
    )

    res.status(response.statusCode).json(response)
  }),
)

manageLoanOfferRoutes.get(
  '/loan-offers/:loan_offer_id',
  authorize(
    requireOrganizationType(
      OrganizationType.HSF_INTERNAL,
      OrganizationType.LENDER_INSTITUTION,
    ),
  ),
  asyncMiddleware(async (req, res) => {
    const {
      params: { loan_offer_id },
      authInfo,
    } = req
    const response = await manageLoanOfferController.getLoanById(
      loan_offer_id,
      authInfo,
    )

    res.status(response.statusCode).json(response)
  }),
)
manageLoanOfferRoutes.put(
  '/loan-offers/:loanOfferId',
  authorize(requireOrganizationType(OrganizationType.LENDER_INSTITUTION)),
  validateRequest(updateLoanOfferSchema),
  asyncMiddleware(async (req, res) => {
    const {
      body,
      authInfo,
      params: { loanOfferId },
    } = req

    const response = await manageLoanOfferController.updateLoanOffer(
      loanOfferId,
      body,
      authInfo,
    )

    res.status(response.statusCode).json(response)
  }),
)

manageLoanOfferRoutes.patch(
  '/loan-offers/:loanOfferId/workflow',
  authorize(requireOrganizationType(OrganizationType.LENDER_INSTITUTION)),
  validateRequest(setLoanOfferWorkflowStatusSchema),
  asyncMiddleware(async (req, res) => {
    const {
      body,
      authInfo,
      params: { loanOfferId },
    } = req
    const response = await manageLoanOfferController.updateLoanOfferWorkflow(
      loanOfferId,
      body,
      authInfo,
    )

    res.status(response.statusCode).json(response)
  }),
)

export default manageLoanOfferRoutes
