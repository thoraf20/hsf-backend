import { ApplicationCustomError } from '@middleware/errors/customError'
import { createResponse } from '@presentation/response/responseType'
import { ServiceOfferingFilters } from '@shared/types/repoTypes'
import { ServiceOfferingService } from '@use-cases/ServiceOffering/serviceOffering'
import {
  CreateServiceOfferingInput,
  UpdateServiceOfferingInput,
} from '@validators/serviceOfferingValidator'
import { StatusCodes } from 'http-status-codes'

export class ServiceOfferingController {
  constructor(
    private readonly serviceOfferingService: ServiceOfferingService,
  ) {}

  async createServiceOffering(
    input: CreateServiceOfferingInput,
    createdById: string,
  ) {
    const serviceOffering =
      await this.serviceOfferingService.createServiceOffering({
        ...input,
        created_by_id: createdById,
      })

    return createResponse(
      StatusCodes.CREATED,
      'Service offering created successfully',
      serviceOffering,
    )
  }

  async getAllServiceOfferings(query: ServiceOfferingFilters) {
    const serviceOfferings =
      await this.serviceOfferingService.getAllServiceOfferings(query)

    return createResponse(
      StatusCodes.OK,
      'Service offerings retrieved successfully',
      serviceOfferings,
    )
  }

  async getServiceOfferingByProductCode(productCode: string) {
    const serviceOffering =
      await this.serviceOfferingService.getServiceOfferingByProductCode(
        productCode,
      )

    if (!serviceOffering) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Service offering not found',
      )
    }

    return createResponse(
      StatusCodes.OK,
      'Service offering retrieved successfully',
      serviceOffering,
    )
  }

  async getServiceOfferingById(serviceOfferingId: string) {
    const serviceOffering =
      await this.serviceOfferingService.getServiceOfferingById(
        serviceOfferingId,
      )

    if (!serviceOffering) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Service offering not found',
      )
    }

    return createResponse(
      StatusCodes.OK,
      'Service offering retrieved successfully',
      serviceOffering,
    )
  }

  async updateServiceOffering(
    serviceOfferingId: string,
    input: UpdateServiceOfferingInput,
  ) {
    const serviceOffering =
      await this.serviceOfferingService.updateServiceOffering(
        serviceOfferingId,
        input,
      )

    if (!serviceOffering) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Service offering not found',
      )
    }

    return createResponse(
      StatusCodes.OK,
      'Service offering updated successfully',
      serviceOffering,
    )
  }
}
