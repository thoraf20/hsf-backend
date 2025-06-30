import {
  LoanAgreementStatus,
  LoanOfferWorkflowStatus,
} from '@domain/enums/loanEnum'
import { ApplicationPurchaseType } from '@domain/enums/propertyEnum'
import { Application, MortgageApplicationStage } from '@entities/Application'
import { Lender } from '@entities/Lender'
import { Organization } from '@entities/Organization'
import { getUserClientView, UserClientView } from '@entities/User'
import { runWithTransaction } from '@infrastructure/database/knex'
import { IApplicationRespository } from '@interfaces/IApplicationRespository'
import { ILenderRepository } from '@interfaces/ILenderRepository'
import { ILoanAgreementRepository } from '@interfaces/ILoanAgreementRepository'
import { ILoanOfferRepository } from '@interfaces/ILoanOfferRepository'
import { IOrganizationRepository } from '@interfaces/IOrganizationRepository'
import { IUserRepository } from '@interfaces/IUserRepository'
import { ApplicationCustomError } from '@middleware/errors/customError'
import calculateLoanMetrics from '@shared/respositoryValues/loanCalculationService'
import { AuthInfo } from '@shared/utils/permission-policy'
import {
  SetLoanOfferWorkflowStatusInput,
  UpdateLoanOfferInput,
} from '@validators/loanOfferValidator'
import { LoanOfferFilters } from '@validators/loanValidator'
import { StatusCodes } from 'http-status-codes'

export class ManageLoanOfferService {
  constructor(
    private readonly loanOfferRepository: ILoanOfferRepository,
    private readonly userRepository: IUserRepository,
    private readonly organizationRepository: IOrganizationRepository,
    private readonly applicationRepository: IApplicationRespository,
    private readonly loanAgreementRepository: ILoanAgreementRepository,

    private readonly lenderProfileRepository: ILenderRepository,
  ) {}

  async getLoanOffers(filters: LoanOfferFilters) {
    const loanOffersContent =
      await this.loanOfferRepository.getLoanOffers(filters)

    loanOffersContent.result = await Promise.all(
      loanOffersContent.result.map(async (loanOffer) => {
        let userClientView: UserClientView | null = null
        if (loanOffer.user_id) {
          const user = await this.userRepository.findById(loanOffer.user_id)

          if (user) {
            userClientView = getUserClientView(user)
          }
        }

        let organization: Organization
        if (loanOffer.organization_id) {
          organization = await this.organizationRepository.getOrganizationById(
            loanOffer.organization_id,
          )
        }

        let lenderOrg: Lender
        if (loanOffer.lender_org_id) {
          lenderOrg = (await this.lenderProfileRepository.getLenderByOrgId(
            loanOffer.lender_org_id,
          ))!

          lenderOrg.organization =
            await this.organizationRepository.getOrganizationById(
              loanOffer.lender_org_id,
            )
        }

        let application: Application
        if (loanOffer.application_id) {
          application = await this.applicationRepository.getApplicationById(
            loanOffer.application_id,
          )
        }

        return {
          ...loanOffer,
          organization,
          application,
          lender_org: lenderOrg,
          user: userClientView,
        }
      }),
    )
    return loanOffersContent
  }

  async getLoanOfferById(loanOfferId: string) {
    const loanOffer =
      await this.loanOfferRepository.getLoanOfferById(loanOfferId)

    if (!loanOffer) {
      return null
    }

    let userClientView: UserClientView | null = null
    if (loanOffer.user_id) {
      const user = await this.userRepository.findById(loanOffer.user_id)

      if (user) {
        userClientView = getUserClientView(user)
      }
    }

    let organization: Organization | null = null
    if (loanOffer.organization_id) {
      organization = await this.organizationRepository.getOrganizationById(
        loanOffer.organization_id,
      )
    }
    let lenderOrg: Lender
    if (loanOffer.lender_org_id) {
      lenderOrg = (await this.lenderProfileRepository.getLenderByOrgId(
        loanOffer.lender_org_id,
      ))!

      lenderOrg.organization =
        await this.organizationRepository.getOrganizationById(
          loanOffer.lender_org_id,
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

    let application: Application
    if (loanOffer.application_id) {
      application = await this.applicationRepository.getApplicationById(
        loanOffer.application_id,
      )
    }

    return {
      ...loanOffer,
      organization,
      application,
      lender_org: lenderOrg,
      user: userClientView,
    }
  }

  async updateLoanOffer(
    loanOfferId: string,
    input: UpdateLoanOfferInput,
    authInfo: AuthInfo,
  ) {
    const loanOffer =
      await this.loanOfferRepository.getLoanOfferById(loanOfferId)

    if (
      !(loanOffer && loanOffer.lender_org_id === authInfo.currentOrganizationId)
    ) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Loan offer not found',
      )
    }

    if (input.interest_rate <= 1) {
      //the calculate loan metric expect interest rate to be in the ratio of hundred (i.e 1 - 100%)
      //while the interest rate migth be sent as unit less than 1 (i.e 0.00 - 1) so 0.23 -> 23%
      input.interest_rate = input.interest_rate * 100
    }

    const loanMetrics = calculateLoanMetrics(
      input.loan_amount,
      input.interest_rate,
      input.loan_term_months,
      input.repayment_frequency,
    )

    const updatedLoanOffer = await this.loanOfferRepository.updateLoanOffer(
      loanOffer.id,
      {
        ...input,
        estimated_periodic_payment: loanMetrics.periodicPayment,
        total_payable_estimate: loanMetrics.totalPayable,
        total_interest_estimate: loanMetrics.totalInterest,
        workflow_status:
          !loanOffer.workflow_status ||
          loanOffer.workflow_status === LoanOfferWorkflowStatus.GENERATED
            ? LoanOfferWorkflowStatus.UNDER_REVIEW
            : loanOffer.workflow_status,
      },
    )

    return updatedLoanOffer
  }

  async updateLoanOfferWorkflow(
    loanOfferId: string,
    input: SetLoanOfferWorkflowStatusInput,
    authInfo: AuthInfo,
  ) {
    const loanOffer =
      await this.loanOfferRepository.getLoanOfferById(loanOfferId)

    if (
      !(loanOffer && loanOffer.lender_org_id === authInfo.currentOrganizationId)
    ) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Loan offer not found',
      )
    }

    if (loanOffer.workflow_status === input.workflow_status) {
      if (!input.loan_offer_letter_url) {
        throw new ApplicationCustomError(
          StatusCodes.CONFLICT,
          `Loan offer is already in the '${loanOffer.workflow_status}' state.`,
        )
      }
    }

    const loanAgreement =
      await this.loanAgreementRepository.getLoanAgreementByOfferId(loanOfferId)

    if (
      loanAgreement &&
      loanAgreement.status !== LoanAgreementStatus.Completed
    ) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        `Loan agreement is not completed.`,
      )
    }

    return runWithTransaction(async () => {
      const updatedLoanOffer = await this.loanOfferRepository.updateLoanOffer(
        loanOffer.id,
        {
          workflow_status: input.workflow_status,
          loan_offer_letter_url: input.loan_offer_letter_url,
        },
      )

      const application = await this.applicationRepository.getByUniqueID({
        loan_offer_id: updatedLoanOffer.id,
      })

      if (application?.application_type === ApplicationPurchaseType.MORTGAGE) {
        if (
          updatedLoanOffer.workflow_status === LoanOfferWorkflowStatus.READY
        ) {
          await Promise.all(
            application.stages?.map(async (stage) => {
              if (stage.exit_time) return null

              await this.applicationRepository.updateApplicationStage(
                stage.id,
                {
                  exit_time: new Date(),
                },
              )
            }),
          )

          await this.applicationRepository.addApplicationStage(
            application.application_id,
            {
              entry_time: new Date(),
              application_id: application.application_id,
              user_id: application.user_id,
              stage: MortgageApplicationStage.LoanOffer,
            },
          )
        }
      }

      return updatedLoanOffer
    })
  }
}

/*

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
}*/
