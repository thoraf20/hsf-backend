import { DayAvailabilitySlot, schduleTime } from '@entities/Availabilities'
import {
  ApiResponse,
  createResponse,
} from '@presentation/response/responseType'
import { ManageInspectionUseCase } from '@use-cases/Developer/ManageInpections'
import { StatusCodes } from 'http-status-codes'

export class ManageInspectionController {
  constructor(
    private readonly manageInspectionService: ManageInspectionUseCase,
  ) {}

  async getInspectionList(
    organization_id: string,
    query: any,
  ): Promise<ApiResponse<any>> {
    const response = await this.manageInspectionService.getAllInspectionList(
      organization_id,
      query,
    )
    return createResponse(StatusCodes.OK, 'success', response)
  }

  async getInspectionById(inspection_id: string): Promise<ApiResponse<any>> {
    const response =
      await this.manageInspectionService.getInspectionById(inspection_id)
    return createResponse(StatusCodes.OK, 'success', response)
  }

  async getDayAvailabilityById(
    day_availablity_id: string,
  ): Promise<ApiResponse<any>> {
    const response =
      await this.manageInspectionService.getDayAvailabilityById(
        day_availablity_id,
      )
    return createResponse(StatusCodes.OK, 'success', response)
  }

  async createDayAvailabilityAndSlot(
    payload: schduleTime,
    organization_id: string,
  ): Promise<ApiResponse<any>> {
    const response =
      await this.manageInspectionService.createDayAvailabilityAndSlot(
        payload,
        organization_id,
      )
    return createResponse(StatusCodes.CREATED, 'success', response)
  }

  async getOrganizationAvailability(
    organization_id: string,
  ): Promise<ApiResponse<any>> {
    const response =
      await this.manageInspectionService.getOrganizationAvailability(
        organization_id,
      )
    return createResponse(StatusCodes.OK, 'success', response)
  }

  async rescheduleInspection(
    payload: DayAvailabilitySlot,
    inspection_id: string,
    organization_id: string,
  ): Promise<ApiResponse<any>> {
    const response =
      await this.manageInspectionService.rescheduleInspectionToUpdateInspectionTable(
        payload,
        inspection_id,
        organization_id,
      )
    return createResponse(StatusCodes.OK, 'success', response)
  }

  async updateInspectionStatus(
    inspection_id: string,
    status: string,
    organization_id: string,
  ): Promise<ApiResponse<any>> {
    const response = await this.manageInspectionService.updateInspectionStatus(
      inspection_id,
      status,
      organization_id,
    )
    return createResponse(StatusCodes.OK, 'success', response)
  }

  async deleteInspection(inspection_id: string): Promise<ApiResponse<any>> {
    await this.manageInspectionService.deleteInspection(inspection_id)
    return createResponse(StatusCodes.OK, 'success', {})
  }
}
