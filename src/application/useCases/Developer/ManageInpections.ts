import { getDeveloperClientView } from '@entities/Developer'
import { Inspection, InspectionRescheduleRequest } from '@entities/Inspection'
import { getUserClientView } from '@entities/User'
import { IManageInspectionRepository } from '@interfaces/Developer/IManageInspectionRepository'
import { IApplicationRespository } from '@interfaces/IApplicationRespository'
import { IDeveloperRepository } from '@interfaces/IDeveloperRespository'
import { IPropertyRepository } from '@interfaces/IPropertyRepository'
import { IUserRepository } from '@interfaces/IUserRepository'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { DeveloperRespository } from '@repositories/Agents/DeveloperRepository'
import { OrganizationRepository } from '@repositories/OrganizationRepository'
import { SeekPaginationResult } from '@shared/types/paginate'
import { StatusCodes } from 'http-status-codes'

export class ManageInspectionUseCase {
  constructor(
    private readonly manageInspectionRepository: IManageInspectionRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly applicationRepository: IApplicationRespository,
    private readonly propertyRepository: IPropertyRepository,
    private readonly userRepository: IUserRepository,
    private readonly developerRepository: IDeveloperRepository,
  ) {
    this.manageInspectionRepository = manageInspectionRepository
    this.organizationRepository = organizationRepository
  }

  async getAllInspectionList(
    organization_id: string,
    filter?: any,
  ): Promise<SeekPaginationResult<Inspection>> {
    const organization =
      await this.organizationRepository.getOrganizationById(organization_id)
    if (!organization) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Organization not found',
      )
    }
    return this.manageInspectionRepository.getAllInspectionToBeApproved(
      organization_id,
      filter,
    )
  }

  async getInspectionByApplicationId(applicationId: string) {
    const application =
      await this.applicationRepository.getApplicationById(applicationId)

    if (!application) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Application not found',
      )
    }

    const inspectionContents =
      await this.manageInspectionRepository.getUserInspectionForProperty(
        application.property_id,
        application.user_id,
      )

    inspectionContents.result = await Promise.all(
      inspectionContents.result.map(async (inspection) => {
        const property = await this.propertyRepository.getPropertyById(
          inspection.property_id,
        )

        const createdByUser = await this.userRepository.findById(
          inspection.user_id,
        )

        const developerProfile =
          await this.developerRepository.getDeveloperByOrgId(
            property.organization_id,
          )

        return {
          ...inspection,
          property: {
            ...property,
            developer: getDeveloperClientView(developerProfile),
          },
          created_by: getUserClientView(createdByUser),
        }
      }),
    )

    return inspectionContents
  }

  async getInspectionById(inspection_id: string): Promise<Inspection> {
    return this.manageInspectionRepository.getInspectionById(inspection_id)
  }

  async rescheduleInspection(
    payload: InspectionRescheduleRequest,
  ): Promise<InspectionRescheduleRequest> {
    return this.manageInspectionRepository.rescheduleInspection(payload)
  }
  //
  //  async updateInspectionDetails(
  //     inspection_id: string,
  //     details: Partial<Inspection>,
  // ): Promise<void> {
  //     return this.manageInspectionRepository.updateInspectionDetails(
  //         inspection_id,
  //         details,
  //     );
  // }
}
