import { InspectionMeetingType } from "../../domain/enums/propertyEnum";
import { Inspection } from "../../domain/entities/Inspection";
import { IInspectionRepository } from "../../domain/interfaces/IInspectionRepository";
import { InspectionBaseUtils } from "./utils";
import { ApplicationCustomError } from "../../middleware/errors/customError";
import { StatusCodes } from "http-status-codes";



export class InspectionService {
    private inspectionRepository : IInspectionRepository
    private utilsInspection : InspectionBaseUtils 
    constructor(inspectionRepository: IInspectionRepository) {
        this.inspectionRepository = inspectionRepository
        this.utilsInspection = new InspectionBaseUtils(this.inspectionRepository)
    }
    

    public async ScheduleInspection (input: Inspection, user_id: string) : Promise<Inspection> {
        await this.utilsInspection.findALreadyScheduledInspection(input.property_id, user_id)
        let meet_link: string = "";
        if (input.inspection_meeting_type === InspectionMeetingType.VIDEO_CHAT && !input.amount) {
            throw new ApplicationCustomError(StatusCodes.BAD_REQUEST, `Payment is required for ${InspectionMeetingType.VIDEO_CHAT}`);
        }

        const scheduleInspection = await this.inspectionRepository.createInpection({
            ...input,
            meet_link,
            user_id
        });

        return scheduleInspection;
    }
}