import { ServiceOffering } from '@entities/serviceOffering'
import { SeekPaginationResult } from '@shared/types/paginate'
import { ServiceOfferingFilters } from '@shared/types/repoTypes'

export interface IServiceOfferingRepository {
  createServiceOffering(
    serviceOffering: Partial<ServiceOffering>,
  ): Promise<ServiceOffering>

  updateServiceOffering(
    serviceOfferingId: string,
    serviceOffering: Partial<ServiceOffering>,
  ): Promise<ServiceOffering>

  getById(serviceOfferingId: string): Promise<ServiceOffering>
  getByProductCode(productCode: string): Promise<ServiceOffering>
  getAllServiceOfferings(
    filters?: ServiceOfferingFilters,
  ): Promise<SeekPaginationResult<ServiceOffering>>
}
