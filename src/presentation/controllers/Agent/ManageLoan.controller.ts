import { OrganizationType } from '@domain/enums/organizationEnum'
import { Loan } from '@entities/Loans'
import { createResponse } from '@presentation/response/responseType'
import { AuthInfo } from '@shared/utils/permission-policy'
import { ManageLoanService } from '@use-cases/Loan/ManageLoans'
import { LoanFilters } from '@validators/loanValidator'
import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'

export class ManageLoanController {
  constructor(private readonly manageLoanService: ManageLoanService) {}

  async getLoans(filters: LoanFilters, authInfo: AuthInfo) {
    if (authInfo.organizationType === OrganizationType.LENDER_INSTITUTION) {
      filters.lender_org_id = authInfo.currentOrganizationId
    }

    const loanContents = await this.manageLoanService.getLoans(filters)

    return createResponse(
      StatusCodes.OK,
      'Loans retrieved successfully',
      loanContents,
    )
  }

  async getLoanById(req: Request, res: Response) {
    const { loan_id } = req.params

    const loan = await this.manageLoanService.getLoanById(loan_id)

    if (!loan) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json(createResponse(StatusCodes.NOT_FOUND, 'Loan not found'))
    }

    return res
      .status(StatusCodes.OK)
      .json(createResponse(StatusCodes.OK, 'Loan retrieved successfully', loan))
  }

  async createLoan(req: Request, res: Response) {
    const loanData: Loan = req.body

    const newLoan = await this.manageLoanService.createLoan(loanData)

    return res
      .status(StatusCodes.CREATED)
      .json(
        createResponse(
          StatusCodes.CREATED,
          'Loan created successfully',
          newLoan,
        ),
      )
  }

  async updateLoan(req: Request, res: Response) {
    const { loan_id } = req.params
    const loanData: Partial<Loan> = req.body

    const updatedLoan = await this.manageLoanService.updateLoan(
      loan_id,
      loanData,
    )

    if (!updatedLoan) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json(createResponse(StatusCodes.NOT_FOUND, 'Loan not found'))
    }

    return res
      .status(StatusCodes.OK)
      .json(
        createResponse(
          StatusCodes.OK,
          'Loan updated successfully',
          updatedLoan,
        ),
      )
  }

  async deleteLoan(req: Request, res: Response) {
    const { loan_id } = req.params

    await this.manageLoanService.deleteLoan(loan_id)

    return res
      .status(StatusCodes.OK)
      .json(createResponse(StatusCodes.OK, 'Loan deleted successfully'))
  }
}
