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