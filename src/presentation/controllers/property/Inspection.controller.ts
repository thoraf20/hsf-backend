import { InspectionService } from '@application/useCases/Properties/Inspection'
import { Inspection } from '@domain/entities/Inspection'
import { InspectionStatus } from '@domain/enums/propertyEnum'
import {
  ApiResponse,
  createResponse,
} from '@presentation/response/responseType'
import { StatusCodes } from 'http-status-codes'

export class InspectionController {
  constructor(private readonly inspectionService: InspectionService) {}

  public async scheduleInspectionController(
    input: Inspection,
    user_id: string,
  ): Promise<ApiResponse<any>> {
    const schedule = await this.inspectionService.ScheduleInspection(
      input,
      user_id,
    )
    return createResponse(
      StatusCodes.CREATED,
      'Inspection created successfully',
      schedule,
    )
  }

  public async getScheduleInspection(user: string): Promise<ApiResponse<any>> {
    const inspection = await this.inspectionService.getInspectionSchedule(user)
    return createResponse(
      StatusCodes.OK,
      'Inspection retrived successfully',
      inspection,
    )
  }

  public async updateScheduleInspectionStatus(
    inspectionId: string,
    status: InspectionStatus,
  ) {
    const inspection = await this.inspectionService.updateInspection(
      inspectionId,
      { inspection_status: status },
    )
    return createResponse(
      StatusCodes.OK,
      'Inspection updated successfully',
      inspection,
    )
  }
  public async getDevScheduleInspection(
    user: string,
  ): Promise<ApiResponse<any>> {
    const inspection =
      await this.inspectionService.getAllInspectionByDeveloperId(user)
    return createResponse(
      StatusCodes.OK,
      'Inspection retrived successfully',
      inspection,
    )
  }

  public async getInspectionById(
    property_id: string,
  ): Promise<ApiResponse<any>> {
    const inspection =
      await this.inspectionService.getInspectionById(property_id)
    return createResponse(
      StatusCodes.OK,
      'Inspection retrived successfully',
      inspection,
    )
  }
}
