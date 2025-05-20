import { schduleTime } from "@entities/Availabilities";
import { Inspection, InspectionRescheduleRequest } from "@entities/Inspection";
import { IManageInspectionRepository } from "@interfaces/Developer/IManageInspectionRepository";
import { ApplicationCustomError } from "@middleware/errors/customError";
import { OrganizationRepository } from "@repositories/OrganizationRepository";
import { SeekPaginationResult } from "@shared/types/paginate";
import { StatusCodes } from "http-status-codes";

export class ManageInspectionUseCase {
    constructor(
        private readonly manageInspectionRepository: IManageInspectionRepository,
        private readonly organizationRepository: OrganizationRepository,
    ) {
        this.manageInspectionRepository = manageInspectionRepository;
        this.organizationRepository = organizationRepository;
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

    async getOrganizationAvailability(
        organization_id: string,
    ): Promise<schduleTime> {
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

    async rescheduleInspection(
        payload: InspectionRescheduleRequest,
    ): Promise<InspectionRescheduleRequest> {

        return this.manageInspectionRepository.rescheduleInspection(payload);
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