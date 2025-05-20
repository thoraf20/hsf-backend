import { ApiResponse, createResponse } from "@presentation/response/responseType";
import { ManageInspectionUseCase } from "@use-cases/Developer/ManageInpections";
import { StatusCodes } from "http-status-codes";

export class ManageInspectionController {
    constructor(
        private readonly manageInspectionService: ManageInspectionUseCase
    ) {}
    
    async getInspectionList(organization_id: string, query: any): Promise<ApiResponse<any>> {
           const response = await this.manageInspectionService.getAllInspectionList(organization_id, query)
           return createResponse(
            StatusCodes.OK,
            "success",
            response,    
           )
    }

    async getInspectionById(inspection_id: string): Promise<ApiResponse<any>> {
        const response = await this.manageInspectionService.getInspectionById(inspection_id)
        return createResponse(
            StatusCodes.OK,
            "success",
            response,    
           )
    
}
}