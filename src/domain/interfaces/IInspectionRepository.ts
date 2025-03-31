import { Properties } from "@domain/entities/Property";
import { Inspection } from "@domain/entities/Inspection";
import { SeekPaginationOption, SeekPaginationResult } from "@shared/types/paginate";



export interface IInspectionRepository {
    createInpection (input: Inspection): Promise<Inspection>
    getAlreadySchedulesInspection (property_id: string, user_id: string) : Promise<Inspection> 
    getScheduleInspection (user_id: string): Promise<Inspection[] & Properties[]>
    getAllScheduleInspection ( user_id: string, filter?: Record<string, any>, paginate?: SeekPaginationOption): Promise<SeekPaginationResult<Record<string, any>>> 
    getScheduleInspectionById (inspection_id: string): Promise<Inspection & Properties> 
    getSchedulesInspectionForProperty(property_ids: string[], paginate?: SeekPaginationOption): Promise<SeekPaginationResult<Inspection>>

}