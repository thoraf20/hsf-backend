import { Application, ApplicationStage } from '@entities/Application'
import { TrendResult } from '@shared/types/general.type'
import { SeekPaginationResult } from '@shared/types/paginate'
import {
  ApplicationFilters,
  ApplicationStatsFilterInput,
} from '@validators/applicationValidator'

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

  getApplicationAnalytics(filters: ApplicationStatsFilterInput): Promise<{
    total_applications: number
    total_applications_trend: TrendResult
    approved_clients: number
    approved_clients_trend: TrendResult
    pending_clients: number
    pending_clients_trend: TrendResult
    declined_clients: number
    declined_clients_trend: TrendResult
  }>
}
