import { Application } from '@entities/Application'
import { Lender } from '@entities/Lender'
import { Organization } from '@entities/Organization'
import { getUserClientView, UserClientView } from '@entities/User'
import { IApplicationRespository } from '@interfaces/IApplicationRespository'
import { ILenderRepository } from '@interfaces/ILenderRepository'
import { ILoanOfferRepository } from '@interfaces/ILoanOfferRepository'
import { IOrganizationRepository } from '@interfaces/IOrganizationRepository'
import { IUserRepository } from '@interfaces/IUserRepository'
import { LoanOfferFilters } from '@validators/loanValidator'

export class ManageLoanOfferService {
  constructor(
    private readonly loanOfferRepository: ILoanOfferRepository,
    private readonly userRepository: IUserRepository,
    private readonly organizationRepository: IOrganizationRepository,
    private readonly applicationRepository: IApplicationRespository,

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
