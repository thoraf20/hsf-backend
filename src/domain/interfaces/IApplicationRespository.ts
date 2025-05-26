import { Application } from '@entities/Application'
import { SeekPaginationResult } from '@shared/types/paginate'
import { PropertyFilters } from '@validators/propertyValidator'

export interface IApplicationRespository {
  createApplication(input: Application): Promise<Application>
  getAllApplication(
    filters?: PropertyFilters,
  ): Promise<SeekPaginationResult<any>>
  getApplicationById(application_id: string): Promise<Application>
  getByUniqueID(
    ids: Pick<
      Application,
      | 'eligibility_id'
      | 'property_closing_id'
      | 'loan_offer_id'
      | 'offer_letter_id'
    >,
  ): Promise<Application>
  updateApplication(input: Partial<Application>): Promise<void>
  getLastApplicationIfExist(
    property_id: string,
    user_id: string,
  ): Promise<Application>
}
