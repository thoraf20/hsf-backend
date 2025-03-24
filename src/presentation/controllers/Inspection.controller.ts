import { InspectionService } from "a../../../application/useCases/Inspection";
import { Inspection } from "../../domain/entities/Inspection";
import { ApiResponse, createResponse } from "../../presentation/response/responseType";
import { StatusCodes } from "http-status-codes";



export class InspectionController {
    constructor (private readonly inspectionService: InspectionService) {}

    public async scheduleInspectionController (input:  Inspection, user_id: string): Promise<ApiResponse<any>> {
           const schedule = await this.inspectionService.ScheduleInspection(input, user_id)
           return createResponse (
                StatusCodes.CREATED,
                'Inspection created successfully',
                schedule
           )
    }
}