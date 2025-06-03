import { SeekPaginationResult } from '@shared/types/paginate'
import { Properties } from '@domain/entities/Property'
import { ApplicationStatus } from '@domain/enums/propertyEnum'
import { IPropertyRepository } from '@domain/interfaces/IPropertyRepository'
import { PropertyBaseUtils } from '../utils'
import { OfferLetter } from '@entities/PropertyPurchase'
import { IPurchaseProperty } from '@interfaces/IPropertyPurchaseRepository'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { StatusCodes } from 'http-status-codes'
import { IApplicationRespository } from '@interfaces/IApplicationRespository'
import { ApprovePrequalifyRequestInput } from '@validators/agentsValidator'
import { IDeveloperRepository } from '@interfaces/IDeveloperRespository'
import { IUserRepository } from '@interfaces/IUserRepository'
import { getUserClientView, UserClientView } from '@entities/User'
import { PropertyCount } from '@shared/types/repoTypes'
import {
  SetPropertyIsLiveStatusInput,
  SetPropertyStatusInput,
} from '@validators/propertyValidator'
import { AuthInfo } from '@shared/utils/permission-policy'
import { OrganizationType } from '@domain/enums/organizationEnum'
import { IUserActivityLogRepository } from '@domain/repositories/IUserActivityLogRepository'
import { getIpAddress, getUserAgent } from '@shared/utils/request-context'
import { UserActivityKind } from '@domain/enums/UserActivityKind'

export class manageProperty {
  private readonly propertyRepository: IPropertyRepository
  private readonly purchaseRepository: IPurchaseProperty
  private readonly utilsProperty: PropertyBaseUtils
  private readonly developerRepository: IDeveloperRepository
  private readonly userRepository: IUserRepository
  private readonly userActivityLogRepository: IUserActivityLogRepository

  private applicationRepository: IApplicationRespository
  constructor(
    propertyRepository: IPropertyRepository,
    purchaseRepository: IPurchaseProperty,
    applicationRepository: IApplicationRespository,
    developerRepository: IDeveloperRepository,
    userRepository: IUserRepository,
    userActivityLogRepository: IUserActivityLogRepository,
  ) {
    this.propertyRepository = propertyRepository
    this.purchaseRepository = purchaseRepository
    this.applicationRepository = applicationRepository
    this.developerRepository = developerRepository
    this.userRepository = userRepository
    this.userActivityLogRepository = userActivityLogRepository
    this.utilsProperty = new PropertyBaseUtils(this.propertyRepository)
  }

  public async setPropertyGoLive(
    property_id: string,
    input: SetPropertyIsLiveStatusInput,
    authInfo: AuthInfo,
  ) {
    const property = await this.utilsProperty.getIfPropertyExist(property_id)

    if (
      authInfo.organizationType === OrganizationType.DEVELOPER_COMPANY &&
      property.organization_id !== property.organization_id
    ) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Property not found',
      )
    }

    await this.userActivityLogRepository.create({
      performed_at: new Date(),
      title: `Property Go-Live Status Changed: ${property.property_name}`,
      description: `${authInfo.user.first_name} ${authInfo.user.last_name} set the go-live status of property "${property.property_name}" to ${input.is_live ? 'Live' : 'Not Live'}.`,
      user_id: authInfo.userId,
      ip_address: getIpAddress(),
      user_agent: getUserAgent(),
      activity_type: UserActivityKind.PROPERTY_GO_LIVE,
      metadata: property,
    })

    const updatedProperty =
      await this.propertyRepository.ApproveOrDisApproveProperties(property_id, {
        is_live: input.is_live,
      })

    return updatedProperty
  }

  public async hsfPropertyApproval(
    property_id: string,
    input: SetPropertyStatusInput,
    authInfo: AuthInfo,
  ) {
    const property = await this.utilsProperty.getIfPropertyExist(property_id)

    const updatedProperty =
      await this.propertyRepository.ApproveOrDisApproveProperties(property_id, {
        status: input.status,
      })

    await this.userActivityLogRepository.create({
      performed_at: new Date(),
      title: `Property Status Updated: ${property.property_name}`,
      description: `${authInfo.user.first_name} ${authInfo.user.last_name} updated the status of property "${property.property_name}" to ${input.status.replace(/\_/g, ' ')}.`,
      user_id: authInfo.userId,
      ip_address: getIpAddress(),
      user_agent: getUserAgent(),
      activity_type: UserActivityKind.PROPERTY_APPROVAL,
      metadata: property,
    })

    return updatedProperty
  }

  public async GetPropertyToBeApprove(): Promise<
    SeekPaginationResult<Properties>
  > {
    return await this.propertyRepository.getAllPropertiesTobeApproved()
  }

  public async getPropertyById(propertyId: string) {
    const property = await this.propertyRepository.getPropertyById(propertyId)
    if (!property) {
      return null
    }
    const developer = await this.developerRepository.getDeveloperByOrgId(
      property.organization_id,
    )

    let listed_by: UserClientView & {
      listing_counts?: PropertyCount
    }

    if (property.listed_by_id) {
      const listedBy = await this.userRepository.findById(property.listed_by_id)
      if (listedBy) {
        listed_by = getUserClientView(listedBy)

        listed_by.listing_counts =
          await this.propertyRepository.getAllUserPropertyCount(
            property.organization_id,
            { listed_by: listedBy.id },
          )
      }
    }
    const { result: latestApplications } =
      await this.applicationRepository.getAllApplication({
        result_per_page: 10,
        status: ApplicationStatus.PENDING,
        organization_id: property.organization_id,
      })

    return {
      ...property,
      developer,
      listed_by,
      latest_applications: latestApplications,
    }
  }

  // public async setEscrowAttendance(
  //   input: EscrowInformation,
  //   agent_id: string,
  // ): Promise<EscrowInformation> {
  //   await this.utilsProperty.getIfPropertyExist(input.property_id)
  //   const [escrowInformation, escrowStatus] = await Promise.all([
  //     this.purchaseRepository.setEscrowAttendance({ ...input, agent_id }, []),
  //     this.propertyRepository.updateEscrowMeeting(
  //       input.property_id,
  //       input.property_buyer_id,
  //       EscrowMeetingStatus.AWAITING_ACCEPTANCE,
  //     ),
  //   ])

  //   const application =
  //     await this.applicationRepository.getLastApplicationIfExist(
  //       input.property_id,
  //       input.property_buyer_id,
  //     )
  //   await this.applicationRepository.updateApplication({
  //     property_id: input.property_id,
  //     escrow_information_id: escrowInformation.escrow_id,
  //     escrow_status_id: escrowStatus.escrow_status_id,
  //     user_id: input.property_buyer_id,
  //     application_id: application.application_id,
  //   })

  //   return escrowInformation
  // }

  public async confirmPropertyPurchase(
    input: Record<string, any>,
  ): Promise<void> {
    await Promise.all([
      this.utilsProperty.getIfPropertyExist(input.property_id),
      this.purchaseRepository.confirmPropertyPurchase(
        input.property_id,
        input.user_id,
      ),
    ])
  }

  public async approvePropertyClosing(
    input: Record<string, any>,
  ): Promise<void> {
    await Promise.all([
      this.utilsProperty.getIfPropertyExist(input.property_id),
      this.propertyRepository.UpdatepropertyClosingRequest(input),
    ])
  }

  public async approvePrequalifyRequest(
    input: ApprovePrequalifyRequestInput,
  ): Promise<void> {
    await this.purchaseRepository.approvePrequalifyRequest(input)
  }

  public async changeOfferLetterStatus(
    input: Partial<OfferLetter>,
  ): Promise<OfferLetter> {
    const offerLetter = await this.purchaseRepository.getOfferLetterById(
      input.offer_letter_id,
    )
    if (!offerLetter) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Offer letter not found',
      )
    }

    return await this.purchaseRepository.updateOfferLetterStatus(
      input.offer_letter_id,
      { ...input },
    )
  }
}
