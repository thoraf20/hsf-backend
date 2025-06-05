import { OrganizationType } from '@domain/enums/organizationEnum'
import {
  ApplicationStatus,
  DIPLenderStatus,
  DIPStatus,
  UserAction,
} from '@domain/enums/propertyEnum'
import { MortgageApplicationStage } from '@entities/Application'
import { Address, getUserClientView, UserClientView } from '@entities/User'
import { runWithTransaction } from '@infrastructure/database/knex'
import { IAddressRepository } from '@interfaces/IAddressRepository'
import { IApplicationRespository } from '@interfaces/IApplicationRespository'
import { ILenderRepository } from '@interfaces/ILenderRepository'
import { IMortageRespository } from '@interfaces/IMortageRespository'
import { IPreQualify } from '@interfaces/IpreQualifyRepoitory'
import { IUserRepository } from '@interfaces/IUserRepository'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { QueryBoolean } from '@shared/utils/helpers'
import { AuthInfo } from '@shared/utils/permission-policy'
import {
  DipFilters,
  LenderDipResponse,
  UpdateDipLoanInput,
} from '@validators/applicationValidator'
import { StatusCodes } from 'http-status-codes'

export class ManageDipUseCase {
  constructor(
    private readonly mortgageRepository: IMortageRespository,
    private readonly userRepository: IUserRepository,
    private readonly preQualifyRepositoy: IPreQualify,
    private readonly applicationRepository: IApplicationRespository,
    private readonly addressRepository: IAddressRepository,
    private readonly lenderRepository: ILenderRepository,
  ) {}

  async getDips(authInfo: AuthInfo, filters: DipFilters) {
    let lender_id: string

    if (authInfo.organizationType === OrganizationType.LENDER_INSTITUTION) {
      const lender = await this.lenderRepository.getLenderByOrgId(
        authInfo.currentOrganizationId,
      )

      if (!lender) {
        throw new ApplicationCustomError(
          StatusCodes.NOT_FOUND,
          'Lender not found',
        )
      }

      lender_id = lender.id
    }

    const dipContents = await this.mortgageRepository.getAllDips({
      ...filters,
      lender_id,
    })

    dipContents.result = await Promise.all(
      dipContents.result.map(async (dip) => {
        const user = await this.userRepository.findById(dip.user_id)

        let userClientView: UserClientView | null = null
        if (user) {
          userClientView = getUserClientView(user)
        }

        const prequalify = await this.preQualifyRepositoy.findEligiblityById(
          dip.eligibility_id,
        )

        return {
          ...dip,
          prequalify,
          applicant: userClientView,
        }
      }),
    )

    return dipContents
  }

  async getDipById(applicationId: string, dipId: string) {
    const application =
      await this.applicationRepository.getApplicationById(applicationId)

    if (!application) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Application not found',
      )
    }

    if (application.status === ApplicationStatus.REJECTED) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Sorry, You can proceed with this dip because the application have been rejected',
      )
    }

    const dip = await this.mortgageRepository.getDipByID(dipId)

    if (!dip) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'Dip not found')
    }

    const user = await this.userRepository.findById(dip.user_id)
    let userClientView:
      | (UserClientView & { addresses?: Array<Address> })
      | null = null
    if (user) {
      const addresses = await this.addressRepository.getUserAddresses(user.id)
      userClientView = getUserClientView(user)
      userClientView.addresses = addresses
    }

    const prequalify = await this.preQualifyRepositoy.findEligiblityById(
      dip.eligibility_id,
    )

    return {
      ...dip,
      prequalify,
      applicant: userClientView,
    }
  }

  async updateDip(
    applicationId: string,
    dipId: string,
    input: UpdateDipLoanInput,
  ) {
    const application =
      await this.applicationRepository.getApplicationById(applicationId)

    if (!application) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Application not found',
      )
    }

    if (application.status === ApplicationStatus.REJECTED) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Sorry, You can proceed with this dip because the application have been rejected',
      )
    }

    const dip = await this.mortgageRepository.getDipByID(dipId)

    if (!dip) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'Dip not found')
    }

    if (dip.application_id !== application.application_id) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Dip not associated with this application',
      )
    }

    const updatedDip = await this.mortgageRepository.updateDipById({
      dip_id: dipId,
      approved_loan_amount: input.approved_loan_amount,
      interest_rate: input.interest_rate,
      loan_term: input.loan_term.toString(),
    })

    return updatedDip
  }

  async lenderDipResponse(
    applicationId: string,
    dipId: string,
    input: LenderDipResponse,
  ) {
    const application =
      await this.applicationRepository.getApplicationById(applicationId)

    if (!application) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Application not found',
      )
    }

    if (application.status === ApplicationStatus.REJECTED) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Sorry, You can proceed with this dip because the application have been rejected',
      )
    }

    const dip = await this.mortgageRepository.getDipByID(dipId)

    if (!dip) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'Dip not found')
    }

    if (dip.application_id !== application.application_id) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Dip not associated with this application',
      )
    }

    if (
      dip.dip_lender_status === DIPLenderStatus.Accepted &&
      input.approve === QueryBoolean.YES
    ) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Dip already approved',
      )
    }

    if (
      dip.dip_lender_status === DIPLenderStatus.Rejected &&
      input.approve === QueryBoolean.NO
    ) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Dip already rejected',
      )
    }

    const updatedDip = await this.mortgageRepository.updateDipById({
      dip_id: dip.dip_id,
      dip_lender_status:
        input.approve === QueryBoolean.YES
          ? DIPLenderStatus.Accepted
          : DIPLenderStatus.Rejected,

      dip_status: DIPStatus.AwaitingUserAction,
    })

    return updatedDip
  }

  async userDipResponse(
    authInfo: AuthInfo,
    applicationId: string,
    dipId: string,
    input: LenderDipResponse,
  ) {
    const application =
      await this.applicationRepository.getApplicationById(applicationId)

    if (!(application && application.user_id === authInfo.userId)) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Application not found',
      )
    }

    if (application.status === ApplicationStatus.REJECTED) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Sorry, You can proceed with this dip because the application have been rejected',
      )
    }

    const dip = await this.mortgageRepository.getDipByID(dipId)

    if (!dip) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'Dip not found')
    }

    if (dip.application_id !== application.application_id) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Dip not associated with this application',
      )
    }

    if (dip.dip_status !== DIPStatus.AwaitingUserAction) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'You are not allowed to repond to this DIP at the moment',
      )
    }

    if (
      dip.user_action === UserAction.Accept &&
      input.approve === QueryBoolean.YES
    ) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Dip already approved',
      )
    }

    if (
      dip.user_action === UserAction.Reject &&
      input.approve === QueryBoolean.NO
    ) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Dip already rejected',
      )
    }

    return runWithTransaction(async () => {
      const updatedDip = await this.mortgageRepository.updateDipById({
        dip_id: dip.dip_id,
        user_action:
          input.approve === QueryBoolean.YES
            ? UserAction.Accept
            : UserAction.Reject,

        dip_status: DIPStatus.PaymentPending,
      })

      await this.applicationRepository.addApplicationStage(applicationId, {
        application_id: applicationId,
        user_id: application.user_id,
        stage: MortgageApplicationStage.DecisionInPrinciple,
        entry_time: new Date(),
      })

      return updatedDip
    })
  }
}
