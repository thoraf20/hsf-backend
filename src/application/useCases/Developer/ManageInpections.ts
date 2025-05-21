import { InspectionRescheduleRequestStatusEnum } from "@domain/enums/inspectionEnum";
import { InspectionStatus } from "@domain/enums/propertyEnum";
import { DayAvailabilitySlot, schduleTime } from "@entities/Availabilities";
import { Inspection } from "@entities/Inspection";
import { IManageInspectionRepository } from "@interfaces/Developer/IManageInspectionRepository";
import { ApplicationCustomError } from "@middleware/errors/customError";
import { OrganizationRepository } from "@repositories/OrganizationRepository";
import { InspectionRepository } from "@repositories/property/Inspection";
import { SeekPaginationResult } from "@shared/types/paginate";
import { StatusCodes } from "http-status-codes";

export class ManageInspectionUseCase {
    constructor(
        private readonly manageInspectionRepository: IManageInspectionRepository,
        private readonly organizationRepository: OrganizationRepository,
        private readonly inspectionRespository : InspectionRepository
    ) {
        this.manageInspectionRepository = manageInspectionRepository;
        this.organizationRepository = organizationRepository;
        this.inspectionRespository = inspectionRespository
    }

    async createDayAvailabilityAndSlot(
        payload: schduleTime,
        organization_id: string,
    ): Promise<schduleTime> {
       const day_availability = await this.manageInspectionRepository.dayAvailability({
            organization_id,
            time_slot: payload.time_slot,
        });

         const day_availability_slot = await this.manageInspectionRepository.dayAvailabilitySlot({
            day_availability_id: day_availability.day_availability_id,
            day: payload.day,
            start_time: payload.start_time,
            end_time: payload.end_time,
            is_available: payload.is_available,
         });
          return {
                ...day_availability,
                ...day_availability_slot,
          };
    }

    async getDayAvailabilityById(
        day_availablity_id: string,
    ): Promise<schduleTime> {
        return this.manageInspectionRepository.getdayAvailabilityById(
            day_availablity_id,
        );
    }

    
    async getOrganizationAvailability(
        organization_id: string,
    ): Promise<schduleTime[]> {
        const organization = await this.organizationRepository.getOrganizationById(
            organization_id,
        );
        if(!organization) {
            throw new ApplicationCustomError(StatusCodes.NOT_FOUND, "Organization not found");
        }
        return this.manageInspectionRepository.getOrganizationAvailability(
            organization_id,
        );
    }

    async getDayAvailabilitySlotById(
        day_availablity_slot_id: string,
    ): Promise<schduleTime> {
        return this.manageInspectionRepository.getDayAvailablitySlotById(
            day_availablity_slot_id,
        );
    }

    
    async getAllInspectionList(
        organization_id: string,
        filter?: any,
    ): Promise<SeekPaginationResult<Inspection>> {
        const organization = await this.organizationRepository.getOrganizationById(
            organization_id,
        );
        if(!organization) {
            throw new ApplicationCustomError(StatusCodes.NOT_FOUND, "Organization not found");
        }
        return this.manageInspectionRepository.getAllInspectionToBeApproved(
            organization_id,
            filter,
        );
    }

    

    async getInspectionById(inspection_id: string): Promise<Inspection> {
        return this.manageInspectionRepository.getInspectionById(inspection_id);
    }

    async rescheduleInspectionToUpdateInspectionTable(
        payload: DayAvailabilitySlot,
        inspection_id: string,
        organization_id: string,
    ): Promise<schduleTime> {
        const inspection = await this.manageInspectionRepository.getInspectionById(
            inspection_id,
        );
        if(!inspection) {
            throw new ApplicationCustomError(StatusCodes.NOT_FOUND, "Inspection not found");
        }
        const getSlot = await this.manageInspectionRepository.getDayAvailablitySlotById(inspection.day_availability_slot_id)
        if(getSlot.day_availability_slot_id === payload.day_availability_slot_id) {
            throw new ApplicationCustomError(StatusCodes.BAD_REQUEST, `You can't reschedule same time as before`)
        }
        const availabilities = await this.manageInspectionRepository.getdayAvailabilityById(
            getSlot.day_availability_id,
        );
        if(availabilities.organization_id !== organization_id) {
            throw new ApplicationCustomError(StatusCodes.UNAUTHORIZED, "You are not authorized to access this resource");
        }
        
        if(availabilities.day_availability_slot_id !== payload.day_availability_slot_id) {
            throw new ApplicationCustomError(StatusCodes.BAD_REQUEST, "Invalid day availability slot");
        }
        const reschedule = this.manageInspectionRepository.rescheduleInspectionToUpdateInspectionTable(
            {...payload, confirm_avaliability_for_reschedule: InspectionRescheduleRequestStatusEnum.Proposed, action: "rescheduled" },
            inspection_id,
        );

        await this.inspectionRespository.updateScheduleInpection(inspection_id, {action: "reshedule"})
        return reschedule
    }

    async updateInspectionStatus(
        inspection_id: string,
        status: string,
        organization_id: string
    ): Promise<Inspection> {
         const inspection = await this.manageInspectionRepository.getInspectionById(
            inspection_id,
        );
        if(!inspection) {
            throw new ApplicationCustomError(StatusCodes.NOT_FOUND, "Inspection not found");
        }
        
        if(inspection.inspection_status !== InspectionStatus.PENDING) {
            throw new ApplicationCustomError(StatusCodes.BAD_REQUEST, 'Inspection status has already been updated')
        }
       
        const getSlot = await this.manageInspectionRepository.getDayAvailablitySlotById(inspection.day_availability_slot_id)
        const getAvailability  = await this.manageInspectionRepository.getdayAvailabilityById(getSlot.day_availability_id)
          console.log(getAvailability)
        if(getAvailability.organization_id !== organization_id) {
            throw new ApplicationCustomError(StatusCodes.UNAUTHORIZED, 'You are not permitted to carry out this action')
        }

        const updatedInspection = await this.manageInspectionRepository.updateInspectionStatus(
            inspection_id,
            status,
        ); 
        return updatedInspection
    }

    //
    //  async updateInspectionDetails(
    //     inspection_id: string,
    //     details: Partial<Inspection>,
    // ): Promise<void> {
    //     return this.manageInspectionRepository.updateInspectionDetails(
    //         inspection_id,
    //         details,
    //     );
    // }
}