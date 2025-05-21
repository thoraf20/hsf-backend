import { InspectionService } from '@application/useCases/Properties/Inspection'
import { InspectionStatus } from '@domain/enums/propertyEnum'
import { Inspection } from '@entities/Inspection'
import {
  ApiResponse,
  createResponse,
} from '@presentation/response/responseType'
import { ScheduleInspectionInput } from '@validators/inspectionVaidator'
import { StatusCodes } from 'http-status-codes'

export class InspectionController {
  constructor(private readonly inspectionService: InspectionService) {}

  public async scheduleInspectionController(
    input: ScheduleInspectionInput,
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

  public async getScheduleInspection(user: string, action?: string): Promise<ApiResponse<any>> {
    const inspection = await this.inspectionService.getInspectionSchedule(user, action)
    return createResponse(
      StatusCodes.OK,
      'Inspection retrived successfully',
      inspection,
    )
  }

  public async responseToReschedule(
    inspection_id: string,
    payload: Partial<Inspection>
  ): Promise<ApiResponse<any>> {
    const inspection = await this.inspectionService.reponseToReschedule(
      inspection_id,
      payload,
    )
    return createResponse(
      StatusCodes.OK,
      'Inspection updated successfully',
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
