import { Lender } from '@entities/Lender'
import { Loan } from '@entities/Loans'
import { Organization } from '@entities/Organization'
import { getUserClientView, UserClientView } from '@entities/User'
import { ILenderRepository } from '@interfaces/ILenderRepository'
import { ILoanRepository } from '@interfaces/ILoanRepository'
import { IOrganizationRepository } from '@interfaces/IOrganizationRepository'
import { IUserRepository } from '@interfaces/IUserRepository'
import { LoanFilters } from '@validators/loanValidator'

export class ManageLoanService {
  constructor(
    private readonly loanRepository: ILoanRepository,
    private readonly userRepository: IUserRepository,
    private readonly organizationRepository: IOrganizationRepository,
    private readonly lenderProfileRepository: ILenderRepository,
  ) {}

  async getLoans(filters: LoanFilters) {
    const loanContent = await this.loanRepository.getLoans(filters)

    //@ts-expect-error
    loanContent.result = loanContent.result.map(async (loan) => {
      let userClientView: UserClientView | null = null
      if (loan.user_id) {
        const user = await this.userRepository.findById(loan.user_id)

        if (user) {
          userClientView = getUserClientView(user)
        }
      }

      let organization: Organization
      if (loan.organization_id) {
        organization = await this.organizationRepository.getOrganizationById(
          loan.organization_id,
        )
      }

      let lenderOrg: Lender
      if (loan.lender_org_id) {
        lenderOrg = (await this.lenderProfileRepository.getLenderByOrgId(
          loan.lender_org_id,
        ))!

        lenderOrg.organization =
          await this.organizationRepository.getOrganizationById(
            loan.lender_org_id,
          )
      }

      return {
        ...loan,
        organization,
        lender_org: lenderOrg,
        user: userClientView,
      }
    })
    return loanContent
  }

  async getLoanById(loan_id: string) {
    const loan = await this.loanRepository.getLoanById(loan_id)

    if (!loan) {
      return null
    }

    let userClientView: UserClientView | null = null
    if (loan.user_id) {
      const user = await this.userRepository.findById(loan.user_id)

      if (user) {
        userClientView = getUserClientView(user)
      }
    }

    let organization: Organization | null = null
    if (loan.organization_id) {
      organization = await this.organizationRepository.getOrganizationById(
        loan.organization_id,
      )
    }
    let lenderOrg: Lender
    if (loan.lender_org_id) {
      lenderOrg = (await this.lenderProfileRepository.getLenderByOrgId(
        loan.lender_org_id,
      ))!

      lenderOrg.organization =
        await this.organizationRepository.getOrganizationById(
          loan.lender_org_id,
        )

      let owner: UserClientView

      if (lenderOrg.organization.owner_user_id) {
        const ownerUser = await this.userRepository.findById(
          lenderOrg.organization.owner_user_id,
        )

        if (ownerUser) {
          owner = getUserClientView(ownerUser)
        }
      }

      lenderOrg.owner = owner
    }

    return {
      ...loan,
      organization,
      lender_org: lenderOrg,
      user: userClientView,
    }
  }

  async createLoan(loan: Loan): Promise<Loan> {
    return this.loanRepository.createLoan(loan)
  }

  async updateLoan(loan_id: string, loan: Partial<Loan>): Promise<Loan | null> {
    return this.loanRepository.updateLoan(loan_id, loan)
  }

  async deleteLoan(loan_id: string): Promise<void> {
    return this.loanRepository.deleteLoan(loan_id)
  }
}
