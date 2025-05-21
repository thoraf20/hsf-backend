import { Inspection, InspectionRescheduleRequest } from '@entities/Inspection'
import { SeekPaginationResult } from '@shared/types/paginate'

export interface IManageInspectionRepository {
  getAllInspectionToBeApproved: (
    organization_id: string,
    filter?: any,
  ) => Promise<SeekPaginationResult<Inspection>>
  getInspectionById: (inspection_id: string) => Promise<Inspection>
  getUserInspectionForProperty(
    propertyId: string,
    userId: string,
  ): Promise<SeekPaginationResult<Inspection>>
  rescheduleInspection: (
    payload: InspectionRescheduleRequest,
  ) => Promise<InspectionRescheduleRequest>
  updateInspectionDetails: (
    inspection_id: string,
    details: Partial<Inspection>,
  ) => Promise<void>
}
