import { Application } from '@entities/Application'
import { SeekPaginationResult } from '@shared/types/paginate'
import { PropertyFilters } from '@shared/types/repoTypes'

export interface IApplicationRespository {
  createApplication(input: Application): Promise<Application>
  getAllUserApplication(
    user_id: string,
    filters?: PropertyFilters,
  ): Promise<SeekPaginationResult<any>>
  getApplicationById(application_id: string): Promise<Application>
  updateApplication(input: Partial<Application>): Promise<void>
  getLastApplicationIfExist(
    property_id: string,
    user_id: string,
  ): Promise<Application>
}
