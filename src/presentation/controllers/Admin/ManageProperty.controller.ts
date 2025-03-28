import { ApiResponse, createResponse } from "../../../presentation/response/responseType"
import { propertyApprovalStatus } from "../../../domain/enums/propertyEnum"
import { StatusCodes } from "http-status-codes"
import { manageProperty } from "../../../application/useCases/Admin/ManageProperty"




export class MangagePropertyController {

   constructor(private readonly managePropertyService: manageProperty) {}
    async ApprovedOrDisApproveProperty(
        property_id: string,
        input: propertyApprovalStatus,
      ): Promise<ApiResponse<any>> {
        const { is_live } = await this.managePropertyService.ApproveOrDisApproveProperty(
          property_id,
          input,
        )
    
        const message = is_live
          ? 'Property has been approved successfully'
          : 'Property has been disapproved successfully'
    
        return createResponse(StatusCodes.OK, message, {})
      }


    async GetAllPropertiesToBeApproved () : Promise<ApiResponse<any>> {
        const properties = await this.managePropertyService.GetPropertyToBeApprove()
        return createResponse(
            StatusCodes.OK,
            'Properties retrived successfully',
            properties
        ) 
    }
}