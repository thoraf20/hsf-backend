import { LoanOfferRepository } from '@repositories/loans/LoanOfferRepository'
import { OrganizationRepository } from '@repositories/OrganizationRepository'
import { asyncMiddleware, validateRequest } from '@routes/index.t'
import { Router } from 'express'
import { LoanAgreementRepository } from '@repositories/loans/LoanAgreementRepository'
import { ManageLoanAgreementService } from '@use-cases/Loan/ManageLoanAgreement'
import { ApplicationRepository } from '@repositories/property/ApplicationRespository'
import { LoanRepository } from '@repositories/loans/LoanRepository'
import { ManageLoanAgreementController } from '@controllers/Agent/ManageLoanAgreement.controller'
import { validateRequestQuery } from '@shared/utils/paginate'
import {
  loanAgreementFilterSchema,
  setLoanAgreementLetterSchema,
} from '@validators/loanAgreementValidator'
import { authorize } from '@middleware/authorization'
import {
  isHomeBuyer,
  RequireAny,
  requireOrganizationType,
} from '@shared/utils/permission-policy'
import { OrganizationType } from '@domain/enums/organizationEnum'
import { UserRepository } from '@repositories/user/UserRepository'
import { DocumentRepository } from '@repositories/property/DcoumentRepository'

const manageLoanAgreementRoutes = Router()

const loanAgreementRepository = new LoanAgreementRepository()
const loanOfferRepository = new LoanOfferRepository()
const organizationRepository = new OrganizationRepository()
const loanRepository = new LoanRepository()
const applicationRepository = new ApplicationRepository()
const userRepository = new UserRepository()
const documentRepository = new DocumentRepository()
const manageLoanAgreementService = new ManageLoanAgreementService(
  loanAgreementRepository,
  loanRepository,
  loanOfferRepository,
  organizationRepository,
  applicationRepository,
  userRepository,
  documentRepository,
)
const manageLoanAgreementController = new ManageLoanAgreementController(
  manageLoanAgreementService,
)

manageLoanAgreementRoutes.get(
  '/loan-agreements',
  validateRequestQuery(loanAgreementFilterSchema),
  authorize(
    requireOrganizationType(
      OrganizationType.HSF_INTERNAL,
      OrganizationType.LENDER_INSTITUTION,
    ),
  ),
  asyncMiddleware(async (req, res) => {
    const { query } = req
    const response =
      await manageLoanAgreementController.getLoanAgreements(query)
    res.status(response.statusCode).json(response)
  }),
)

manageLoanAgreementRoutes.get(
  '/loan-agreements/:loan_agreement_id',
  authorize(
    RequireAny(
      isHomeBuyer,
      requireOrganizationType(
        OrganizationType.HSF_INTERNAL,
        OrganizationType.LENDER_INSTITUTION,
      ),
    ),
  ),
  asyncMiddleware(async (req, res) => {
    const {
      params: { loan_agreement_id },
      authInfo,
    } = req
    const response = await manageLoanAgreementController.getLoanAgreementById(
      loan_agreement_id,
      authInfo,
    )
    res.status(response.statusCode).json(response)
  }),
)

manageLoanAgreementRoutes.post(
  '/loan-agreements/:loanAgreementId/agreement-letter',
  authorize(requireOrganizationType(OrganizationType.LENDER_INSTITUTION)),
  validateRequest(setLoanAgreementLetterSchema),
  asyncMiddleware(async (req, res) => {
    const {
      params: { loanAgreementId },
      body,
      authInfo,
    } = req
    const response = await manageLoanAgreementController.setLoanAgreementLetter(
      loanAgreementId,
      body,
      authInfo,
    )

    res.status(response.statusCode).json(response)
  }),
)

// manageLoanAgreementRoutes.put(
//   '/loan-agreements/:loan_agreement_id',
//   validateRequest(updateLoanAgreementSchema),
//   asyncMiddleware(async (req, res) => {
//     const {
//       params: { loan_agreement_id },
//       body,
//       /*authInfo,*/
//     } = req
//     const response = await manageLoanAgreementController.updateLoanAgreement(
//       loan_agreement_id,
//       body,
//       /*authInfo,*/
//     )
//     res.status(response.statusCode).json(response)
//   }),
// )

// manageLoanAgreementRoutes.delete(
//   '/loan-agreements/:loan_agreement_id',
//   asyncMiddleware(async (req, res) => {
//     const {
//       params: { loan_agreement_id },
//       /*authInfo,*/
//     } = req
//     const response = await manageLoanAgreementController.deleteLoanAgreement(
//       loan_agreement_id /*, authInfo*/,
//     )
//     res.status(response.statusCode).json(response)
//   }),
// )

export default manageLoanAgreementRoutes
