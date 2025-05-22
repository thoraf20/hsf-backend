import { SeekPaginationResult } from '@shared/types/paginate'
import { Properties } from '@domain/entities/Property'
import {
  EscrowMeetingStatus,
  propertyApprovalStatus,
} from '@domain/enums/propertyEnum'
import { IPropertyRepository } from '@domain/interfaces/IPropertyRepository'
import { PropertyBaseUtils } from '../utils'
import { OfferLetter } from '@entities/PropertyPurchase'
import { IPurchaseProperty } from '@interfaces/IPropertyPurchaseRepository'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { StatusCodes } from 'http-status-codes'
import { EscrowInformation } from '@entities/PurchasePayment'
import { IApplicationRespository } from '@interfaces/IApplicationRespository'
import { ApprovePrequalifyRequestInput } from '@validators/agentsValidator'

export class manageProperty {
  private readonly propertyRepository: IPropertyRepository
  private readonly purchaseRepository: IPurchaseProperty
  private readonly utilsProperty: PropertyBaseUtils
  private applicationRepository: IApplicationRespository
  constructor(
    propertyRepository: IPropertyRepository,
    purchaseRepository: IPurchaseProperty,
    applicationRepository: IApplicationRespository,
  ) {
    this.propertyRepository = propertyRepository
    this.purchaseRepository = purchaseRepository
    this.applicationRepository = applicationRepository
    this.utilsProperty = new PropertyBaseUtils(this.propertyRepository)
  }

  public async ApproveOrDisApproveProperty(
    property_id: string,
    status: propertyApprovalStatus,
  ): Promise<{ is_live: boolean }> {
    await this.utilsProperty.getIfPropertyExist(property_id)
    const newPropertyStatus = status === propertyApprovalStatus.APPROVED
    let is_live: boolean
    if (status === propertyApprovalStatus.APPROVED) {
      is_live = true
    } else {
      is_live = false
    }

    await this.propertyRepository.ApproveOrDisApproveProperties(property_id, {
      is_live,
      status,
    })

    console.log(
      `Property ${property_id} status updated to ${status}: is_live = ${newPropertyStatus}`,
    )

    return { is_live: newPropertyStatus }
  }

  public async GetPropertyToBeApprove(): Promise<
    SeekPaginationResult<Properties>
  > {
    return await this.propertyRepository.getAllPropertiesTobeApproved()
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
