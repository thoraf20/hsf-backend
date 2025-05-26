// HSF-Backend-New/src/application/useCases/ManageOrganizations.ts
import { Organization } from '@domain/entities/Organization'
import { UserOrganizationMember } from '@domain/entities/UserOrganizationMember'
import { OrganizationType } from '@domain/enums/organizationEnum'
import {
  ADMIN_LEVEL_ROLES,
  DEVELOPER_COMPANY_ROLES,
  HSF_INTERNAL_ROLES,
  LENDER_INSTITUTION_ROLES,
  Role,
} from '@domain/enums/rolesEmun'
import { AddressType, UserStatus } from '@domain/enums/userEum'
import { IOrganizationRepository } from '@domain/interfaces/IOrganizationRepository'
import { getUserClientView, User } from '@entities/User' // Import User
import { IAddressRepository } from '@interfaces/IAddressRepository'
import { ILenderRepository } from '@interfaces/ILenderRepository'
import { IUserRepository } from '@interfaces/IUserRepository'
import { ApplicationCustomError } from '@middleware/errors/customError'
import {
  SeekPaginationOption,
  SeekPaginationResult,
} from '@shared/types/paginate' // Import pagination types
import { generateRandomPassword } from '@shared/utils/helpers'
import emailHelper from '@infrastructure/email/template/constant' // Import email helper
import { AuthInfo, isHigherRoleLevel } from '@shared/utils/permission-policy'
import {
  CreateHSFAdminInput,
  CreateLenderInput,
  LenderFilters,
} from '@validators/organizationValidator'
import { StatusCodes } from 'http-status-codes'
import { UserFilters } from '@validators/userValidator'
import { IDeveloperRepository } from '@interfaces/IDeveloperRespository'
import {
  CreateDeveloperInput,
  DeveloperFilters,
} from '@validators/developerValidator'
import { IPropertyRepository } from '@interfaces/IPropertyRepository'
import { IDocumentRepository } from '@interfaces/IDocumentRepository'
import { DocumentGroupKind } from '@domain/enums/documentEnum'

export class ManageOrganizations {
  constructor(
    private readonly organizationRepository: IOrganizationRepository,
    private readonly userRepository: IUserRepository,
    private readonly lenderRepository: ILenderRepository,
    private readonly addressRepository: IAddressRepository,
    private readonly developerRepository: IDeveloperRepository,
    private readonly propertyRepository: IPropertyRepository,
    private readonly documentRepository: IDocumentRepository,
  ) {}

  async createOrganization(organization: Organization): Promise<Organization> {
    return this.organizationRepository.createOrganization(organization)
  }

  async getOrganizationById(id: string): Promise<Organization | null> {
    return this.organizationRepository.getOrganizationById(id)
  }

  async updateOrganization(
    id: string,
    organization: Partial<Organization>,
  ): Promise<Organization | null> {
    return this.organizationRepository.updateOrganization(id, organization)
  }

  async deleteOrganization(id: string): Promise<void> {
    return this.organizationRepository.deleteOrganization(id)
  }

  async addUserToOrganization(
    userOrganizationMember: UserOrganizationMember,
  ): Promise<UserOrganizationMember> {
    return this.organizationRepository.addUserToOrganization(
      userOrganizationMember,
    )
  }

  async removeUserFromOrganization(
    userId: string,
    organizationId: string,
  ): Promise<void> {
    return this.organizationRepository.removeUserFromOrganization(
      userId,
      organizationId,
    )
  }

  async getOrganizationMembers(
    organizationId: string,
    paginateOption?: SeekPaginationOption, // Accept pagination option
  ): Promise<
    SeekPaginationResult<
      UserOrganizationMember & { user: User; role: { name: string } }
    >
  > {
    return this.organizationRepository.getOrganizationMembers(
      organizationId,
      paginateOption,
    )
  }

  async getOrganizationsForUser(userId: string) {
    return this.organizationRepository.getOrganizationsByUserId(userId)
  }

  async getCurrentOrgRoles(organizationType: OrganizationType) {
    let types: Array<Role> = []
    switch (organizationType) {
      case OrganizationType.HSF_INTERNAL:
        types = HSF_INTERNAL_ROLES
        break

      case OrganizationType.DEVELOPER_COMPANY:
        types = DEVELOPER_COMPANY_ROLES
        break

      case OrganizationType.LENDER_INSTITUTION:
        types = LENDER_INSTITUTION_ROLES

      default:
        return null
    }
    return this.userRepository.getRolesByType(types)
  }

  async getRoles() {
    return this.userRepository.getRoles()
  }

  async getLenders(filters: LenderFilters) {
    const lenderContents = await this.lenderRepository.getAllLenders(filters)
    lenderContents.result = await Promise.all(
      lenderContents.result.map(async (lender) => {
        const organization =
          await this.organizationRepository.getOrganizationById(
            lender.organization_id,
          )

        let owner: User
        if (organization.owner_user_id) {
          owner = await this.userRepository.findById(organization.owner_user_id)
        }
        return { ...lender, organization, owner: getUserClientView(owner) }
      }),
    )
    return lenderContents
  }

  async getAdmins(filters: UserFilters, type: 'admin' | 'sub-admin') {
    return this.userRepository.getAllUsers({
      ...filters,
      type,
    })
  }

  async createLender(data: CreateLenderInput) {
    const [lenderRole] = await this.userRepository.getRolesByType([
      Role.LENDER_ADMIN,
    ])

    if (!lenderRole) {
      throw new ApplicationCustomError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'We are unable to create lender',
      )
    }

    const generatedPass = generateRandomPassword()
    const hashedPassword =
      await this.userRepository.hashedPassword(generatedPass)
    const lenderOwner = await this.userRepository.create({
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      status: UserStatus.Pending,
      password: hashedPassword,
      phone_number: data.phone_number,
      is_admin: true,
      force_password_reset: true,
      role_id: lenderRole.id,
    })

    const lenderOrg = await this.organizationRepository.createOrganization({
      name: data.lender_name,
      owner_user_id: lenderOwner.id,
      type: OrganizationType.LENDER_INSTITUTION,
    })

    await this.organizationRepository.addUserToOrganization({
      role_id: lenderOwner.role_id,
      organization_id: lenderOrg.id,
      user_id: lenderOwner.id,
    })

    // Send invitation email with credentials
    const fullName = `${data.first_name} ${data.last_name}`
    emailHelper.InvitationEmail(
      lenderOwner.email,
      fullName,
      'YOUR_ACTIVATION_LINK_PLACEHOLDER', // Replace with actual activation link logic
      lenderOrg.name,
      generatedPass,
    )

    const lender = await this.lenderRepository.createLender({
      lender_name: data.lender_name,
      lender_type: data.lender_institution_type,
      cac: data.lender_registration_number,
      state: data.lender_state,
      head_office_address: data.lender_address_line,
      organization_id: lenderOrg.id,
    })

    return {
      ...lender,
      organization: lenderOrg,
      owner: {
        ...getUserClientView(
          await this.userRepository.findById(lenderOwner.id),
        ),
        password: generatedPass,
      },
    }
  }

  async createHSFSubAdmin(auth: AuthInfo, input: CreateHSFAdminInput) {
    const newAdminRole = await this.userRepository.getRoleById(input.role_id)
    if (!newAdminRole) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'Role not found')
    }

    if (HSF_INTERNAL_ROLES.includes(newAdminRole.name as Role)) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Invalid HSF role',
      )
    }

    if (
      ADMIN_LEVEL_ROLES.includes(newAdminRole.name as Role) ||
      !isHigherRoleLevel(auth.globalRole, newAdminRole.name as Role)
    ) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'You are not permitted to add someone of higher role than yours',
      )
    }

    const [existingEmailUser, existingPhoneUser] = await Promise.all([
      this.userRepository.findByEmail(input.email),
      this.userRepository.findByPhone(input.phone_number),
    ])

    if (existingEmailUser) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Email not available',
      )
    }

    if (existingPhoneUser) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Phone number not available',
      )
    }

    const generatedPass = generateRandomPassword()
    const hashedPassword =
      await this.userRepository.hashedPassword(generatedPass)

    const newAdminUser = await this.userRepository.create({
      first_name: input.first_name,
      last_name: input.last_name,
      email: input.email,
      status: UserStatus.Pending,
      password: hashedPassword,
      phone_number: input.phone_number,
      is_admin: true,
      force_password_reset: true,
      role_id: newAdminRole.id,
    })

    await this.addressRepository.create({
      user_id: newAdminUser.id,
      city: input.city,
      state: input.state,
      country: input.country,
      street_address: input.street_address,
      address_type: AddressType.Home,
    })

    // Send invitation email with credentials
    const fullName = `${input.first_name} ${input.last_name}`
    emailHelper.InvitationEmail(
      newAdminUser.email,
      fullName,
      'YOUR_ACTIVATION_LINK_PLACEHOLDER', // Replace with actual activation link logic
      newAdminRole.name,
      generatedPass,
    )

    const membership = await this.organizationRepository.addUserToOrganization({
      organization_id: auth.currentOrganizationId,
      role_id: newAdminRole.id,
      user_id: newAdminUser.id,
    })

    return {
      ...getUserClientView({
        ...newAdminUser,
        role: newAdminRole.name as Role,
      }),
      membership: {
        ...membership,
        role: newAdminRole,
      },
    }
  }

  async createHSFAdmin(auth: AuthInfo, input: CreateHSFAdminInput) {
    const newAdminRole = await this.userRepository.getRoleById(input.role_id)
    if (!newAdminRole) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'Role not found')
    }

    if (
      !(
        ADMIN_LEVEL_ROLES.includes(newAdminRole.name as Role) &&
        (auth.globalRole === Role.SUPER_ADMIN ||
          isHigherRoleLevel(auth.globalRole!, newAdminRole.name as Role))
      )
    ) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'You are not permitted to add someone of higher role than yours',
      )
    }

    const [existingEmailUser, existingPhoneUser] = await Promise.all([
      this.userRepository.findByEmail(input.email),
      this.userRepository.findByPhone(input.phone_number),
    ])

    if (existingEmailUser) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Email not available',
      )
    }

    if (existingPhoneUser) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Phone number not available',
      )
    }

    const generatedPass = generateRandomPassword()
    const hashedPassword =
      await this.userRepository.hashedPassword(generatedPass)

    const newAdminUser = await this.userRepository.create({
      first_name: input.first_name,
      last_name: input.last_name,
      email: input.email,
      status: UserStatus.Pending,
      password: hashedPassword,
      phone_number: input.phone_number,
      is_admin: true,
      force_password_reset: true,
      role_id: newAdminRole.id,
    })

    await this.addressRepository.create({
      user_id: newAdminUser.id,
      city: input.city,
      state: input.state,
      country: input.country,
      street_address: input.street_address,
      address_type: AddressType.Home,
    })

    // Send invitation email with credentials
    const fullName = `${input.first_name} ${input.last_name}`
    emailHelper.InvitationEmail(
      newAdminUser.email,
      fullName,
      'YOUR_ACTIVATION_LINK_PLACEHOLDER', // Replace with actual activation link logic
      newAdminRole.name,
      generatedPass,
    )

    const membership = await this.organizationRepository.addUserToOrganization({
      organization_id: auth.currentOrganizationId,
      role_id: newAdminRole.id,
      user_id: newAdminUser.id,
    })

    return {
      ...getUserClientView({
        ...newAdminUser,
        role: newAdminRole.name as Role,
      }),
      membership: {
        ...membership,
        role: newAdminRole,
      },
    }
  }

  async getDevelopers(filters: DeveloperFilters) {
    const developerContents =
      await this.developerRepository.getDevelopers(filters)

    developerContents.result = await Promise.all(
      developerContents.result.map(async (developer) => {
        const organization =
          await this.organizationRepository.getOrganizationById(
            developer.organization_id,
          )

        if (!organization) {
          return developer
        }

        const owner = await this.userRepository.findById(
          organization.owner_user_id,
        )

        const meta = await this.propertyRepository.findPropertiesByDeveloperOrg(
          developer.organization_id,
          { result_per_page: 1 },
        )

        return {
          ...developer,
          owner: getUserClientView(owner),
          property_listing_counts: meta.total_records,
          organization: {
            ...organization,
          },
        }
      }),
    )

    return developerContents
  }

  async createDeveloper(data: CreateDeveloperInput) {
    const developerRole = await this.userRepository.getRoleByName(
      Role.DEVELOPER_ADMIN,
    )
    if (!developerRole) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'Role not found')
    }

    const [existingEmailUser, existingPhoneUser] = await Promise.all([
      this.userRepository.findByEmail(data.email),
      this.userRepository.findByPhone(data.phone_number),
    ])

    if (existingEmailUser) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Email not available',
      )
    }

    if (existingPhoneUser) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Phone number not available',
      )
    }

    const developerDocGroup =
      await this.documentRepository.findDocumentGroupByTag(
        DocumentGroupKind.DeveloperVerification,
      )

    if (!developerDocGroup) {
      throw new ApplicationCustomError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Developer verification document group not found. Please check server configuration.',
      )
    }

    const documentGroupTypes =
      await this.documentRepository.findGroupDocumentTypesByGroupId(
        developerDocGroup.id,
      )

    const missingDocType = documentGroupTypes
      .filter((documentGroupType) => documentGroupType.is_user_uploadable)
      .find(
        (documentType) =>
          !data.documents.find(
            (providedDoc) => providedDoc.id === documentType.id,
          ) || documentType.is_required_for_group,
      )

    if (missingDocType) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        `Missing document type ${missingDocType.display_label} not uploaded.`,
      )
    }

    const generatedPass = generateRandomPassword()
    const hashedPassword =
      await this.userRepository.hashedPassword(generatedPass)

    const developerOwner = await this.userRepository.create({
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      status: UserStatus.Pending,
      password: hashedPassword,
      phone_number: data.phone_number,
      is_admin: true,
      force_password_reset: true,
      role_id: developerRole.id,
    })

    const developerOrg = await this.organizationRepository.createOrganization({
      name: data.company_name,
      owner_user_id: developerOwner.id,
      type: OrganizationType.DEVELOPER_COMPANY,
    })

    await Promise.all(
      data.documents.map((document) =>
        this.documentRepository.createApplicationDocumentEntry({
          document_group_type_id: document.id,
          document_name: document.file_name,
          document_url: document.file_url,
          document_size: String(document.file_size),
          organization_id: developerOrg.id,
        }),
      ),
    )

    await this.organizationRepository.addUserToOrganization({
      role_id: developerOwner.role_id,
      organization_id: developerOrg.id,
      user_id: developerOwner.id,
    })

    const developerProfile =
      await this.developerRepository.createDeveloperProfile({
        company_email: data.company_email,
        company_image: data.company_image,
        city: data.city,
        company_name: data.company_name,
        company_registration_number: data.company_registration_number,
        organization_id: developerOrg.id,
        office_address: data.office_address,
        region_of_operation: data.operation_states,
        specialization: data.specialization,
        state: data.state,
        years_in_business: data.year_in_business,
      })

    const fullName = `${developerOwner.first_name} ${developerOwner.last_name}`
    emailHelper.InvitationEmail(
      developerOwner.email,
      fullName,
      'YOUR_ACTIVATION_LINK_PLACEHOLDER',
      developerRole.name,
      generatedPass,
    )

    return {
      ...developerProfile,
      organization: developerOrg,
      owner: {
        ...getUserClientView(
          await this.userRepository.findById(developerOwner.id),
        ),
        password: generatedPass,
      },
    }
  }

  async getDeveloperRegRequiredDoc() {
    const developerDocGroup =
      await this.documentRepository.findDocumentGroupByTag(
        DocumentGroupKind.DeveloperVerification,
      )

    if (!developerDocGroup) {
      throw new ApplicationCustomError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Developer verification document group not found. Please check server configuration.',
      )
    }

    const documentGroupTypes =
      await this.documentRepository.findGroupDocumentTypesByGroupId(
        developerDocGroup.id,
      )

    return {
      ...developerDocGroup,
      documents: documentGroupTypes,
    }
  }
}
