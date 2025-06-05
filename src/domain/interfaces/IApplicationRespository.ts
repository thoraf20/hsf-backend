import { Application, ApplicationStage } from '@entities/Application'
import { SeekPaginationResult } from '@shared/types/paginate'
import { ApplicationFilters } from '@validators/applicationValidator'

export interface IApplicationRespository {
  createApplication(input: Application): Promise<Application>
  getAllApplication(
    filters?: ApplicationFilters,
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

  addApplicationStage(
    applicationId: string,
    stage: ApplicationStage,
  ): Promise<ApplicationStage>
  updateApplicationStage(
    applicationStageId: string,
    stage: Partial<ApplicationStage>,
  ): Promise<ApplicationStage>
}
