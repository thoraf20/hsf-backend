import { DayAvailability, DayAvailabilitySlot, schduleTime } from "@entities/Availabilities"
import { Inspection} from "@entities/Inspection"
import { SeekPaginationResult } from "@shared/types/paginate"

export interface IManageInspectionRepository {
    dayAvailability: (payload:  DayAvailability) => Promise<DayAvailability>
    getDayAvailablitySlotById : (day_availablity_slot_id: string) => Promise<schduleTime>
    dayAvailabilitySlot: (payload:  DayAvailabilitySlot) => Promise<DayAvailabilitySlot>
    getdayAvailabilityById: (day_availablity_id: string) => Promise<schduleTime>
    getAllInspectionToBeApproved: (organization_id: string, filter?: any) => Promise<SeekPaginationResult<Inspection>>
    getInspectionById: (inspection_id: string) => Promise<Inspection>
    rescheduleInspectionToUpdateInspectionTable: (payload: DayAvailabilitySlot, inspection_id: string) => Promise<schduleTime>
    updateInspectionStatus: (inspection_id: string, status: string) => Promise<Inspection>
    getOrganizationAvailability: (organization_id: string) => Promise<schduleTime[]>
    // resheduleInspection: (res) => Promise<InspectionRescheduleRequest>
    updateInspectionDetails: (
        inspection_id: string,
        details: Partial<Inspection>,
    ) => Promise<void>
}