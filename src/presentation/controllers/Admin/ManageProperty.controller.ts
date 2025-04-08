import {
  ApiResponse,
  createResponse,
} from '@presentation/response/responseType'
import { propertyApprovalStatus } from '@domain/enums/propertyEnum'
import { StatusCodes } from 'http-status-codes'
import { manageProperty } from '@application/useCases/Admin/ManageProperty'
import { EscrowInformation } from '@entities/PurchasePayment'

export class MangagePropertyController {
  constructor(private readonly managePropertyService: manageProperty) {}
  async ApprovedOrDisApproveProperty(
    property_id: string,
    input: propertyApprovalStatus,
  ): Promise<ApiResponse<any>> {
    const { is_live } =
      await this.managePropertyService.ApproveOrDisApproveProperty(
        property_id,
        input,
      )

    const message = is_live
      ? 'Property has been approved successfully'
      : 'Property has been disapproved successfully'

    return createResponse(StatusCodes.OK, message, {})
  }

  async GetAllPropertiesToBeApproved(): Promise<ApiResponse<any>> {
    const properties = await this.managePropertyService.GetPropertyToBeApprove()
    return createResponse(
      StatusCodes.OK,
      'Properties retrived successfully',
      properties,
    )
  }
  async setEscrowAttendance(input: EscrowInformation, agent_id: string): Promise<ApiResponse<any>> {
    const escrow = await this.managePropertyService.setEscrowAttendance(input, agent_id)
    return createResponse(
      StatusCodes.OK,
      'Success',
      escrow,
    )
  }
  async confirmPropertyPurchase(input: Record<string, any>): Promise<ApiResponse<any>> {
   await this.managePropertyService.confirmPropertyPurchase(input)
    return createResponse(
      StatusCodes.OK,
      'Success'
    )
  }

  async approvePrequalifyRequest (input: Record<string, any>): Promise<ApiResponse<any>> {
    await this.managePropertyService.approvePrequalifyRequest(input)
     return createResponse(
       StatusCodes.OK,
       'Success'
     )
   }
  async changeOfferLetterStatus (input: Record<string, any>): Promise<ApiResponse<any>> {
    await this.managePropertyService.changeOfferLetterStatus(input)
     return createResponse(
       StatusCodes.OK,
       'Success'
     )
   }
}
