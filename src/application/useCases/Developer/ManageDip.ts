import { ApplicationStatus } from '@domain/enums/propertyEnum'
import { Address, getUserClientView, UserClientView } from '@entities/User'
import { IAddressRepository } from '@interfaces/IAddressRepository'
import { IApplicationRespository } from '@interfaces/IApplicationRespository'
import { IMortageRespository } from '@interfaces/IMortageRespository'
import { IPreQualify } from '@interfaces/IpreQualifyRepoitory'
import { IUserRepository } from '@interfaces/IUserRepository'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { DipFilters } from '@validators/applicationValidator'
import { StatusCodes } from 'http-status-codes'

export class ManageDipUseCase {
  constructor(
    private readonly mortgageRepository: IMortageRespository,
    private readonly userRepository: IUserRepository,
    private readonly preQualifyRepositoy: IPreQualify,
    private readonly applicationRepository: IApplicationRespository,
    private readonly addressRepository: IAddressRepository,
  ) {}

  async getDips(filters: DipFilters) {
    const dipContents = await this.mortgageRepository.getAllDips(filters)

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
}
