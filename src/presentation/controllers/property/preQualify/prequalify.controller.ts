import { ApplicationCustomError } from '@middleware/errors/customError'
import {
  ApiResponse,
  createResponse,
} from '@presentation/response/responseType'
import { preQualifyService } from '@use-cases/Properties/preQualify/prequalify'
import {
  PreQualifierEligibleInput,
  PreQualifierStatusQuery,
  PreQualifyFilters,
  PreQualifyRequestInput,
} from '@validators/prequalifyValidation'
import { StatusCodes } from 'http-status-codes'

export class preQualifyController {
  constructor(private readonly service: preQualifyService) {}

  public async preQualifierController(
    input: PreQualifyRequestInput,
    user_id: string,
  ): Promise<ApiResponse<any>> {
    await this.service.storePreQualify(input, user_id)
    return createResponse(StatusCodes.CREATED, `success`, {})
  }

  public async verification(
    input: Record<string, any>,
  ): Promise<ApiResponse<any>> {
    const prequalification = await this.service.verification(input)
    return createResponse(StatusCodes.OK, `Success`, prequalification)
  }
  public async getPrequalifierByUserId(
    user_id: string,
    query: PreQualifierStatusQuery,
  ): Promise<ApiResponse<any>> {
    const preQualifier = await this.service.getPrequalifierByUserId(
      user_id,
      query,
    )
    return createResponse(StatusCodes.OK, `Success`, preQualifier)
  }
  public async getAllPreQualifierToBeapproved(): Promise<ApiResponse<any>> {
    const preQualifier = await this.service.getAllPreQualifierToBeapproved()
    return createResponse(StatusCodes.OK, `Success`, preQualifier)
  }

  public async getPreQualifyRequestById(id: string): Promise<ApiResponse<any>> {
    const preQualifier = await this.service.getPreQualifyRequestById(id)

    if (!preQualifier) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Prequalifier not found',
      )
    }

    return createResponse(
      StatusCodes.OK,
      `Prequalifier retrived successfully`,
      preQualifier,
    )
  }

  public async getAllPreQualifiers(
    filters: PreQualifyFilters,
  ): Promise<ApiResponse<any>> {
    const preQualifiers = await this.service.getAllPrequalifiers(filters)
    return createResponse(
      StatusCodes.OK,
      'Prequalifies retrieved successfully',
      preQualifiers,
    )
  }

  public async updatePrequalifierEligibility(
    input: PreQualifierEligibleInput,
  ): Promise<ApiResponse<any>> {
    const prequalification =
      await this.service.updatePrequalifierEligibility(input)

    return createResponse(StatusCodes.OK, `Success`, prequalification)
  }
}
