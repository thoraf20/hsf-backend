import { Application } from "@entities/Application";
import { Properties } from "@entities/Property";
import { SeekPaginationResult } from "@shared/types/paginate";
import { PropertyFilters } from "@shared/types/repoTypes";



export interface IApplicationRespository {
    createApplication(input: Application): Promise<Application>
    getAllUserApplication(user_id: string, filters?: PropertyFilters): Promise<SeekPaginationResult<any>>
    getApplicationById(application_id: string): Promise<Properties>
    updateApplication(input: Application) :Promise<void>
    getIfApplicationIsRecorded(property_id: string,user_id: string): Promise<Application>
}