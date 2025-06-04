import { ManageLoanController } from '@controllers/Agent/ManageLoan.controller'
import { LenderRepository } from '@repositories/Agents/LenderRepository'
import { LoanRepository } from '@repositories/loans/LoanRepository'
import { OrganizationRepository } from '@repositories/OrganizationRepository'
import { UserRepository } from '@repositories/user/UserRepository'
import { asyncMiddleware } from '@routes/index.t'
import { validateRequestQuery } from '@shared/utils/paginate'
import { ManageLoanService } from '@use-cases/Loan/ManageLoans'
import { loanFilterSchema } from '@validators/loanValidator'
import { Router } from 'express'

const manageLoanRoutes = Router()
const manageLoanService = new ManageLoanService(
  new LoanRepository(),
  new UserRepository(),
  new OrganizationRepository(),
  new LenderRepository(),
)
const manageLoanController = new ManageLoanController(manageLoanService)

manageLoanRoutes.get(
  '/loans',
  validateRequestQuery(loanFilterSchema),
  asyncMiddleware(async (req, res) => {
    const { query, authInfo } = req
    const response = await manageLoanController.getLoans(query, authInfo)

    res.status(response.statusCode).json(response)
  }),
)

export default manageLoanRoutes
