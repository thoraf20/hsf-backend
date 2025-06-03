import {
  ApiResponse,
  createResponse,
} from '@presentation/response/responseType'
import { StatusCodes } from 'http-status-codes'
import { manageProperty } from '@use-cases/Agent/ManageProperty'
import { IPurchaseProperty } from '@interfaces/IPropertyPurchaseRepository'
import { ApprovePrequalifyRequestInput } from '@validators/agentsValidator'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { AuthInfo } from '@shared/utils/permission-policy'
import { OrganizationType } from '@domain/enums/organizationEnum'
import {
  SetPropertyIsLiveStatusInput,
  SetPropertyStatusInput,
} from '@validators/propertyValidator'
import { PropertyApprovalStatus } from '@domain/enums/propertyEnum'

export class MangagePropertyController {
  constructor(
    private readonly managePropertyService: manageProperty,
    private readonly escrowStatus: IPurchaseProperty,
  ) {}
  async setPropertyGoLive(
    property_id: string,
    input: SetPropertyIsLiveStatusInput,
    authInfo: AuthInfo,
  ): Promise<ApiResponse<any>> {
    const property = await this.managePropertyService.setPropertyGoLive(
      property_id,
      input,
      authInfo,
    )

    const message = property.is_live
      ? 'Property has been approved successfully'
      : 'Property has been disapproved successfully'

    return createResponse(StatusCodes.OK, message, property)
  }

  async hsfPropertyApproval(
    property_id: string,
    input: SetPropertyStatusInput,
    authInfo: AuthInfo,
  ) {
    const property = await this.managePropertyService.hsfPropertyApproval(
      property_id,
      input,
      authInfo,
    )

    const message =
      property.status === PropertyApprovalStatus.APPROVED
        ? 'Property has been approved successfully'
        : property.status === PropertyApprovalStatus.DECLINED
          ? 'Property has been disapproved successfully'
          : 'Property approval set to pending successfully'

    return createResponse(StatusCodes.OK, message, property)
  }

  async GetAllPropertiesToBeApproved(): Promise<ApiResponse<any>> {
    const properties = await this.managePropertyService.GetPropertyToBeApprove()
    return createResponse(
      StatusCodes.OK,
      'Properties retrived successfully',
      properties,
    )
  }
  // async setEscrowAttendance(
  //   input: EscrowInformation,
  //   agent_id: string,
  // ): Promise<ApiResponse<any>> {
  //   const escrow = await this.managePropertyService.setEscrowAttendance(
  //     input,
  //     agent_id,
  //   )
  //   return createResponse(StatusCodes.OK, 'Success', escrow)
  // }
  async confirmPropertyPurchase(
    input: Record<string, any>,
  ): Promise<ApiResponse<any>> {
    await this.managePropertyService.confirmPropertyPurchase(input)
    return createResponse(StatusCodes.OK, 'Success', {})
  }

  async approvePrequalifyRequest(
    input: ApprovePrequalifyRequestInput,
  ): Promise<ApiResponse<any>> {
    await this.managePropertyService.approvePrequalifyRequest(input)
    return createResponse(StatusCodes.OK, 'Success', {})
  }
  async changeOfferLetterStatus(
    input: Record<string, any>,
  ): Promise<ApiResponse<any>> {
    const offer_letter =
      await this.managePropertyService.changeOfferLetterStatus(input)
    return createResponse(StatusCodes.OK, 'Success', offer_letter)
  }
  async approvePropertyClosing(
    input: Record<string, any>,
  ): Promise<ApiResponse<any>> {
    await Promise.all([
      this.escrowStatus.createEscrowStatus({
        property_id: input.property_id,
        user_id: input.user_id,
      }),
      // this.escrowStatus.updatePropertyClosing(
      //   input.property_id,
      //   input.user_id,
      //   { closing_status: propertyApprovalStatus.APPROVED },
      // ),
    ])

    return createResponse(StatusCodes.OK, 'Success', {})
  }

  async getPropertyById(propertyId: string, authInfo: AuthInfo) {
    const property =
      await this.managePropertyService.getPropertyById(propertyId)

    if (!property) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Property not found',
      )
    }

    if (
      !(
        authInfo.organizationType === OrganizationType.HSF_INTERNAL ||
        property.organization_id === authInfo.currentOrganizationId
      )
    ) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Property not found',
      )
    }

    return createResponse(
      StatusCodes.OK,
      'Property retrieved successfully',
      property,
    )
  }
}
