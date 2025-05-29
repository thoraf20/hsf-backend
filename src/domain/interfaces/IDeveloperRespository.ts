import { Developer, DevelopeReg } from '@entities/Developer'
import { SeekPaginationResult } from '@shared/types/paginate'
import { DeveloperFilters } from '@validators/developerValidator'

export interface IDeveloperRepository {
  createDeveloperProfile: (data: Developer) => Promise<DevelopeReg>
  getDeveloperByOrgId(orgId: string): Promise<Developer>
  getDeveloperById(id: string): Promise<Developer>
  getCompanyName: (company_name: string) => Promise<Developer>
  getCompanyRegistrationNumber: (
    company_registration_number: string,
  ) => Promise<Developer>
  getCompanyEmail: (company_email: string) => Promise<Developer>
  getDevelopers(
    filters: DeveloperFilters,
  ): Promise<SeekPaginationResult<Developer>>
}
