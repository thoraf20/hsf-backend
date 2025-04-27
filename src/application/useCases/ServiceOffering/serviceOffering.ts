import { ServiceOffering } from '@entities/serviceOffering'
import { IServiceOfferingRepository } from '@interfaces/IServiceOfferingRepository'
import { ServiceOfferingFilters } from '@shared/types/repoTypes'
import { UpdateServiceOfferingInput } from '@validators/serviceOfferingValidator'

export class ServiceOfferingService {
  private readonly serviceOfferingRepository: IServiceOfferingRepository

  constructor(serviceOfferingRepository: IServiceOfferingRepository) {
    this.serviceOfferingRepository = serviceOfferingRepository
  }

  async createServiceOffering(
    input: Partial<ServiceOffering>,
  ): Promise<ServiceOffering> {
    const serviceOffering =
      await this.serviceOfferingRepository.createServiceOffering(input)
    return serviceOffering
  }

  async getAllServiceOfferings(query: ServiceOfferingFilters) {
    const serviceOfferings =
      await this.serviceOfferingRepository.getAllServiceOfferings(query)
    return serviceOfferings
  }

  async getServiceOfferingByProductCode(productCode: string) {
    const serviceOffering =
      await this.serviceOfferingRepository.getByProductCode(productCode)
    return serviceOffering
  }

  async getServiceOfferingById(serviceOfferingId: string) {
    const serviceOffering =
      await this.serviceOfferingRepository.getById(serviceOfferingId)
    return serviceOffering
  }

  async updateServiceOffering(
    serviceOfferingId: string,
    input: UpdateServiceOfferingInput,
  ) {
    const serviceOffering =
      await this.serviceOfferingRepository.updateServiceOffering(
        serviceOfferingId,
        input,
      )

    return serviceOffering
  }

  async disableServiceOffering(serviceOfferingId: string): Promise<void> {
    await this.serviceOfferingRepository.updateServiceOffering(
      serviceOfferingId,
      { is_active: false },
    )
  }
  async softDeleteServiceOffering(
    serviceOfferingId: string,
    deleteById: string,
  ): Promise<void> {
    await this.serviceOfferingRepository.updateServiceOffering(
      serviceOfferingId,
      { deleted_at: new Date(), deleted_by_id: deleteById },
    )
  }
}
