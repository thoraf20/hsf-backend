// HSF-Backend-New/src/application/useCases/ManageOrganizations.ts
import { Organization } from '@domain/entities/Organization'
import { UserOrganizationMember } from '@domain/entities/UserOrganizationMember'
import {
  OrganizationMemberStatus,
  OrganizationStatus,
  OrganizationType,
} from '@domain/enums/organizationEnum'
import {
  ADMIN_LEVEL_ROLES,
  DEVELOPER_COMPANY_ROLES,
  HSF_INTERNAL_ROLES,
  isDeveloperCompanyRole,
  isHsfInternalRole,
  isLenderInstitutionRole,
  LENDER_INSTITUTION_ROLES,
  Role,
} from '@domain/enums/rolesEnum'
import { AddressType, UserStatus } from '@domain/enums/userEum'
import emailTemplates from '@infrastructure/email/template/constant'

import { IOrganizationRepository } from '@domain/interfaces/IOrganizationRepository'
import { getUserClientView, User } from '@entities/User' // Import User
import { IAddressRepository } from '@interfaces/IAddressRepository'
import { ILenderRepository } from '@interfaces/ILenderRepository'
import { IUserRepository } from '@interfaces/IUserRepository'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { SeekPaginationResult } from '@shared/types/paginate' // Import pagination types
import { generateRandomPassword } from '@shared/utils/helpers'
import emailHelper from '@infrastructure/email/template/constant' // Import email helper
import { AuthInfo, isHigherRoleLevel } from '@shared/utils/permission-policy'
import {
  CreateEmployeeInput,
  CreateHSFAdminInput,
  CreateLenderInput,
  LenderFilters,
  OrgMembersFilters,
  ResetOrgOwnerPasswordInput,
  SuspendOrgInput,
} from '@validators/organizationValidator'
import { StatusCodes } from 'http-status-codes'
import { UserFilters } from '@validators/userValidator'
import { IDeveloperRepository } from '@interfaces/IDeveloperRepository'
import {
  CreateDeveloperInput,
  DeveloperFilters,
} from '@validators/developerValidator'
import { IPropertyRepository } from '@interfaces/IPropertyRepository'
import { IDocumentRepository } from '@interfaces/IDocumentRepository'
import { DocumentGroupKind } from '@domain/enums/documentEnum'
import template from '@infrastructure/email/template/constant'
import { runWithTransaction } from '@infrastructure/database/knex'
import { IUserActivityLogRepository } from '@domain/repositories/IUserActivityLogRepository'
import { UserActivityKind } from '@domain/enums/UserActivityKind'
import { getIpAddress, getUserAgent } from '@shared/utils/request-context'
import { IContactInformationRepository } from '@interfaces/IContactInformationRepository'
import { ContactInformation } from '@entities/ContactInformation'
import { env } from '@infrastructure/config/env/env.config'

export class ManageOrganizations {
  constructor(
    private readonly organizationRepository: IOrganizationRepository,
    private readonly userRepository: IUserRepository,
    private readonly lenderRepository: ILenderRepository,
    private readonly addressRepository: IAddressRepository,
    private readonly developerRepository: IDeveloperRepository,
    private readonly propertyRepository: IPropertyRepository,
    private readonly documentRepository: IDocumentRepository,
    private readonly userActivityLogRepository: IUserActivityLogRepository,
    private readonly contactInformationRepository: IContactInformationRepository,
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
    paginateOption?: OrgMembersFilters,
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
    return this.organizationRepository.getOrgenizationMemberByUserId(userId)
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
        break
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

        let owner: User & { membership?: UserOrganizationMember }
        if (organization.owner_user_id) {
          owner = await this.userRepository.findById(organization.owner_user_id)
          owner.membership =
            await this.organizationRepository.getOrgenizationMemberByUserId(
              owner.id,
            )
        }
        return { ...lender, organization, owner: getUserClientView(owner) }
      }),
    )
    return lenderContents
  }

  async getLenderById(lenderId: string) {
    const lender = await this.lenderRepository.getLenderById(lenderId)

    const organization = await this.organizationRepository.getOrganizationById(
      lender.organization_id,
    )

    let owner: User & { membership?: UserOrganizationMember }
    if (organization.owner_user_id) {
      owner = await this.userRepository.findById(organization.owner_user_id)
      owner.membership =
        await this.organizationRepository.getOrgenizationMemberByUserId(
          owner.id,
        )
    }
    return { ...lender, organization, owner: getUserClientView(owner) }
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

    return runWithTransaction(async () => {
      const [
        lenderWithName,
        lenderWithCac,
        lenderOwnerWithEmail,
        lenderOwnerWithPhoneNo,
      ] = await Promise.all([
        this.lenderRepository.findLenderByName(data.lender_name),
        this.lenderRepository.findLenderByCac(data.lender_registration_number),
        this.userRepository.findByEmail(data.email),
        this.userRepository.findByPhone(data.phone_number),
      ])

      if (lenderWithName) {
        throw new ApplicationCustomError(
          StatusCodes.CONFLICT,
          'Lender with this name already exists',
        )
      }

      if (lenderWithCac) {
        throw new ApplicationCustomError(
          StatusCodes.CONFLICT,
          'Lender with this CAC already exists',
        )
      }

      if (lenderOwnerWithEmail) {
        throw new ApplicationCustomError(
          StatusCodes.CONFLICT,
          'Lender with this email already exists',
        )
      }

      if (lenderOwnerWithPhoneNo) {
        throw new ApplicationCustomError(
          StatusCodes.CONFLICT,
          'Lender with this phone number already exists',
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
        is_mfa_enabled: true,
        role_id: lenderRole.id,
      })

      const lenderOrg = await this.organizationRepository.createOrganization({
        name: data.lender_name,
        owner_user_id: lenderOwner.id,
        type: OrganizationType.LENDER_INSTITUTION,
        status: data.is_active
          ? OrganizationStatus.ACTIVE
          : OrganizationStatus.INACTIVE,
        address: data.lender_address_line,
        state: data.lender_state,
        city: data.lender_city,
        logo_url: data.lender_logo,
        org_reg_no: data.lender_registration_number,
      })

      await this.organizationRepository.addUserToOrganization({
        role_id: lenderOwner.role_id,
        organization_id: lenderOrg.id,
        user_id: lenderOwner.id,
        status: OrganizationMemberStatus.ACTIVE,
      })

      lenderOwner.membership =
        await this.organizationRepository.getOrgenizationMemberByUserId(
          lenderOwner.id,
        )

      // Send invitation email with credentials
      const fullName = `${data.first_name} ${data.last_name}`
      emailHelper.InvitationEmail(
        lenderOwner.email,
        fullName,
        env.CLIENT_ADMIN_DASHBOARD_URL,
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
          ...getUserClientView({
            ...lenderOwner,
            role: lenderRole.name as Role,
          }),
          password: generatedPass,
        },
      }
    })
  }

  async createHSFSubAdmin(auth: AuthInfo, input: CreateHSFAdminInput) {
    const newAdminRole = await this.userRepository.getRoleById(input.role_id)
    if (!newAdminRole) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'Role not found')
    }

    if (!HSF_INTERNAL_ROLES.includes(newAdminRole.name as Role)) {
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

    return runWithTransaction(async () => {
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
        env.CLIENT_ADMIN_DASHBOARD_URL, // Replace with actual activation link logic
        newAdminRole.name,
        generatedPass,
      )

      const membership =
        await this.organizationRepository.addUserToOrganization({
          organization_id: auth.currentOrganizationId,
          role_id: newAdminRole.id,
          user_id: newAdminUser.id,
          status: OrganizationMemberStatus.ACTIVE,
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
    })
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

    return runWithTransaction(async () => {
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
        is_mfa_enabled: true,
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
        env.CLIENT_ADMIN_DASHBOARD_URL,
        newAdminRole.name,
        generatedPass,
      )

      const membership =
        await this.organizationRepository.addUserToOrganization({
          organization_id: auth.currentOrganizationId,
          role_id: newAdminRole.id,
          user_id: newAdminUser.id,
          status: OrganizationMemberStatus.ACTIVE,
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
    })
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

        if (!organization.status) {
          await this.organizationRepository.updateOrganization(
            organization.id,
            {
              status: OrganizationStatus.ACTIVE,
            },
          )
        }

        let owner: User | null = null
        if (organization.owner_user_id) {
          owner = await this.userRepository.findById(organization.owner_user_id)

          owner.membership =
            await this.organizationRepository.getOrgenizationMemberByUserId(
              owner.user_id,
            )
        }

        const meta = await this.propertyRepository.findPropertiesByDeveloperOrg(
          developer.organization_id,
          { result_per_page: 1 },
        )

        return {
          ...developer,
          owner: owner ? getUserClientView({ ...owner }) : null,
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

    const [
      existingEmailUser,
      existingPhoneUser,
      existingCompanyRegistrationNumber,
      existingCompanyName,
    ] = await Promise.all([
      this.userRepository.findByEmail(data.email),
      this.userRepository.findByPhone(data.phone_number),
      this.developerRepository.getCompanyRegistrationNumber(
        data.company_registration_number,
      ),
      this.developerRepository.getCompanyName(data.company_name),
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

    if (existingCompanyRegistrationNumber) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Company registration number not available',
      )
    }

    if (existingCompanyName) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Company name not available',
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
          ),
      )

    if (missingDocType) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        `Missing document type ${missingDocType.display_label} not uploaded.`,
      )
    }

    return runWithTransaction(async () => {
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
        is_mfa_enabled: true,
        force_password_reset: true,
        role_id: developerRole.id,
      })

      const developerOrg = await this.organizationRepository.createOrganization(
        {
          name: data.company_name,
          owner_user_id: developerOwner.id,
          type: OrganizationType.DEVELOPER_COMPANY,
          status: data.is_active
            ? OrganizationStatus.ACTIVE
            : OrganizationStatus.INACTIVE,
          org_reg_no: data.company_registration_number,
          city: data.city,
          state: data.state,
          logo_url: data.company_image,
          address: data.office_address,
          contact_email: data.company_email,
        },
      )

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
        status: OrganizationMemberStatus.ACTIVE,
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
        env.CLIENT_ADMIN_DASHBOARD_URL,
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
    })
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

  async getDeveloperByDeveloperID(developerId: string) {
    const developer =
      await this.developerRepository.getDeveloperById(developerId)

    if (!developer) {
      return null
    }

    const org = await this.organizationRepository.getOrganizationById(
      developer.organization_id,
    )
    const owner = await this.userRepository.findById(org.owner_user_id)

    const meta = await this.propertyRepository.findPropertiesByDeveloperOrg(
      developer.organization_id,
      { result_per_page: 1 },
    )

    return {
      ...developer,
      owner: getUserClientView(owner),
      property_listing_counts: meta.total_records,
      organization: {
        ...org,
      },
    }
  }

  async resetOrgMemberPassword(authInfo: AuthInfo, memberId: string) {
    const member =
      await this.organizationRepository.getOrganizationMemberByMemberID(
        memberId,
        authInfo.currentOrganizationId,
      )

    if (!member) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Member not found in this organization',
      )
    }

    const organization = await this.organizationRepository.getOrganizationById(
      authInfo.currentOrganizationId,
    )

    if (
      !(
        isHigherRoleLevel(authInfo.globalRole, member.role.name as Role) ||
        authInfo.userId === organization.owner_user_id
      )
    ) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'you are not authorized to reset password this admin account',
      )
    }

    if (authInfo.organizationMembership.memberId === member.id) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'You are not allow to self reset your password. Please contact an Admin with higher priviledge on your organization.',
      )
    }

    const defaultPassword = generateRandomPassword()
    const hashedPassword =
      await this.userRepository.hashedPassword(defaultPassword)

    const user = await this.userRepository.update(member.user_id, {
      password: hashedPassword,
      is_default_password: true,
      force_password_reset: true,
    })

    const url = `${process.env.FRONTEND_URL}/auth/login`
    template.passwordResetForOrganization(
      user.email,
      `${user.first_name} ${user.last_name}`,
      defaultPassword,
      url,
      organization.name,
    )

    return {
      email: user.email,
      generated_password: defaultPassword,
    }
  }

  async hsfResetOrgMemberPassword(
    authInfo: AuthInfo,
    input: ResetOrgOwnerPasswordInput,
  ) {
    const organization = await this.organizationRepository.getOrganizationById(
      input.organization_id,
    )

    if (!organization) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Organization not found',
      )
    }

    const member =
      await this.organizationRepository.getOrganizationMemberByMemberID(
        input.member_id,
        organization.id,
      )

    if (!member) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Member not found in this organization',
      )
    }

    const defaultPassword = generateRandomPassword()
    const hashedPassword =
      await this.userRepository.hashedPassword(defaultPassword)

    const user = await this.userRepository.update(member.user_id, {
      password: hashedPassword,
      is_default_password: true,
      force_password_reset: false,
    })

    const url = `${process.env.FRONTEND_URL}/auth/login`
    template.passwordResetForOrganization(
      user.email,
      `${user.first_name} ${user.last_name}`,
      defaultPassword,
      url,
      organization.name,
    )

    return {
      email: user.email,
      generated_password: defaultPassword,
    }
  }

  async disableOrgMember2fa(authInfo: AuthInfo, memberId: string) {
    const member =
      await this.organizationRepository.getOrganizationMemberByMemberID(
        memberId,
        authInfo.currentOrganizationId,
      )

    if (!member) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Member not found in this organization',
      )
    }

    const organization = await this.organizationRepository.getOrganizationById(
      authInfo.currentOrganizationId,
    )

    if (
      !(
        isHigherRoleLevel(authInfo.globalRole, member.role.name as Role) ||
        authInfo.userId === organization.owner_user_id
      )
    ) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'you are not authorized to disable 2fa this admin account',
      )
    }

    if (authInfo.organizationMembership.memberId === member.id) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'You are not allow to disable 2fa for your self. Please contact an Admin with higher priviledge on your organization.',
      )
    }

    let user = await this.userRepository.findById(member.user_id)

    if (!user.require_authenticator_mfa) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        '2FA is already disabled for this user.',
      )
    }

    user = await this.userRepository.update(member.user_id, {
      require_authenticator_mfa: false,
      mfa_totp_secret: null,
    })

    await this.userRepository.clearRecoveryCodesByUserId(user.id)
    template.disableOrgMember2faEmail(
      user.email,
      `${user.first_name} ${user.last_name}`,
      organization.name,
    )

    return getUserClientView(user)
  }

  async suspendOrganization(
    id: string,
    input: SuspendOrgInput,
  ): Promise<Organization | null> {
    const organization =
      await this.organizationRepository.getOrganizationById(id)

    if (!organization) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Organization not found',
      )
    }

    if (
      organization.status === OrganizationStatus.SUSPENDED ||
      organization.status === OrganizationStatus.DELETED
    ) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        `Organization is already ${organization.status.toLowerCase()}`,
      )
    }

    return runWithTransaction(async () => {
      const updatedOrganization =
        await this.organizationRepository.updateOrganization(id, {
          status: OrganizationStatus.SUSPENDED,
          suspension_date: new Date(),
        })

      const orgMembers =
        await this.organizationRepository.getOrganizationMembers(id, {
          page_number: 1,
          result_per_page: Number.MAX_SAFE_INTEGER,
        })

      await Promise.all(
        orgMembers.result.map((member) =>
          this.userRepository.update(member.user_id, {
            status: UserStatus.Suspended,
            supended_at: new Date(),
          }),
        ),
      )

      const ipAddress = getIpAddress()
      const userAgent = getUserAgent()
      await this.userActivityLogRepository.create({
        activity_type: UserActivityKind.ORGANIZAION_SUSPENDED,
        title: `Organization "${organization.name}" Suspended`,
        description: input.reason,
        performed_at: new Date(),
        organization_id: organization.id,
        ip_address: ipAddress,
        user_agent: userAgent,
      })

      return updatedOrganization
    })
  }

  async activateOrganization(id: string): Promise<Organization | null> {
    const organization =
      await this.organizationRepository.getOrganizationById(id)

    if (!organization) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Organization not found',
      )
    }

    if (organization.status === OrganizationStatus.ACTIVE) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Organization is already active',
      )
    }

    if (organization.status === OrganizationStatus.DELETED) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'Cannot activate a deleted organization',
      )
    }

    return runWithTransaction(async () => {
      const updatedOrganization =
        await this.organizationRepository.updateOrganization(id, {
          status: OrganizationStatus.ACTIVE,
        })

      const orgMembers =
        await this.organizationRepository.getOrganizationMembers(id, {
          page_number: 1,
          result_per_page: Number.MAX_SAFE_INTEGER,
        })

      await Promise.all(
        orgMembers.result.map((member) =>
          this.userRepository.update(member.user_id, {
            status: UserStatus.Deleted,
            deleted_at: new Date(),
          }),
        ),
      )

      if (
        updatedOrganization &&
        updatedOrganization.contact_email &&
        updatedOrganization.name
      ) {
        emailTemplates.sendOrganizationActivatedEmail(
          updatedOrganization.contact_email,
          updatedOrganization.name,
        )
      }

      return updatedOrganization
    })
  }

  async deleteOrganization(id: string) {
    const organization =
      await this.organizationRepository.getOrganizationById(id)

    if (!organization) {
      throw new Error('Organization not found')
    }

    if (organization.status === OrganizationStatus.DELETED) {
      throw new Error(
        `Organization is already ${organization.status.toLowerCase()}`,
      )
    }

    return runWithTransaction(async () => {
      // Potentially add checks here to ensure no active resources are linked to the organization
      // e.g., active properties, active users, etc.

      const updateOrg = await this.organizationRepository.updateOrganization(
        id,
        {
          status: OrganizationStatus.DELETED,
          deletion_date: new Date(),
        },
      )

      const orgMembers =
        await this.organizationRepository.getOrganizationMembers(id, {
          page_number: 1,
          result_per_page: Number.MAX_SAFE_INTEGER,
        })

      await Promise.all(
        orgMembers.result.map((member) =>
          this.userRepository.update(member.user_id, {
            status: UserStatus.Deleted,
            deleted_at: new Date(),
          }),
        ),
      )

      if (organization.contact_email && organization.name) {
        emailTemplates.sendOrganizationDeletedEmail(
          organization.contact_email,
          organization.name,
        )
      }

      return updateOrg
    })
  }

  async createEmployee(authInfo: AuthInfo, input: CreateEmployeeInput) {
    const orgMemberRole = await this.userRepository.getRoleById(input.role_id)
    if (!orgMemberRole) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, 'Role not found')
    }

    let checkOrgRole =
      authInfo.organizationType === OrganizationType.HSF_INTERNAL
        ? isHsfInternalRole
        : authInfo.organizationType === OrganizationType.DEVELOPER_COMPANY
          ? isDeveloperCompanyRole
          : authInfo.organizationType === OrganizationType.LENDER_INSTITUTION
            ? isLenderInstitutionRole
            : null

    if (!(checkOrgRole && checkOrgRole(orgMemberRole.name as Role))) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        `Role ${orgMemberRole.name} not available for this organization`,
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

    return runWithTransaction(async () => {
      const generatedPass = generateRandomPassword()
      const hashedPassword =
        await this.userRepository.hashedPassword(generatedPass)

      const memberUser = await this.userRepository.create({
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email,
        status: UserStatus.Pending,
        password: hashedPassword,
        phone_number: input.phone_number,
        is_admin: true,
        force_password_reset: true,
        is_mfa_enabled: true,
        role_id: orgMemberRole.id,
      })

      await this.organizationRepository.addUserToOrganization({
        role_id: orgMemberRole.id,
        organization_id: authInfo.currentOrganizationId,
        user_id: memberUser.id,
        status: OrganizationMemberStatus.ACTIVE,
      })

      memberUser.membership =
        await this.organizationRepository.getOrgenizationMemberByUserId(
          memberUser.id,
        )

      await this.contactInformationRepository.create({
        user_id: memberUser.id,
        contact_number: input.contact_phone_number,
        country_code: input.contact_phone_country_code,
        email: input.contact_email,
        emergency_address: input.contact_emergency_address,
        emergency_contact: input.contact_emergency_address,
        emergency_relationship: input.contact_emergency_relation,
        emergency_name: input.contact_emergency_name,
      })

      const fullName = `${memberUser.first_name} ${memberUser.last_name}`

      emailHelper.InvitationEmail(
        memberUser.email,
        fullName,
        env.CLIENT_ADMIN_DASHBOARD_URL,
        fullName,
        generatedPass,
      )

      return {
        ...getUserClientView({
          ...memberUser,
          role: orgMemberRole.name as Role,
        }),
        password: generatedPass,
      }
    })
  }

  async getOrgMemberById(
    organizationId: string,
    memberId: string,
    authInfo: AuthInfo,
  ) {
    const org =
      await this.organizationRepository.getOrganizationById(organizationId)

    if (!org) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Organization not found',
      )
    }

    if (
      !(
        authInfo.organizationType === OrganizationType.HSF_INTERNAL ||
        org.id === authInfo.currentOrganizationId
      )
    ) {
      throw new ApplicationCustomError(
        StatusCodes.FORBIDDEN,
        'You are not authorized to access this organization',
      )
    }

    const membership =
      await this.organizationRepository.getOrganizationMemberByMemberID(
        memberId,
        organizationId,
      )

    if (!membership) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Member not found',
      )
    }

    const memberUser = await this.userRepository.findById(membership.user_id)
    const addresses = await this.addressRepository.getUserAddresses(
      membership.user_id,
    )

    if (membership?.created_by_user_id) {
      const createdByUser = await this.userRepository.findById(
        membership.created_by_user_id,
      )
      membership.created_by_user = createdByUser
        ? getUserClientView(createdByUser)
        : null
    }

    let contactInformation: ContactInformation | null = null
    if (membership?.user_id) {
      contactInformation = await this.contactInformationRepository.findByUserId(
        membership.user_id,
      )
    }

    return {
      ...membership,
      user: getUserClientView({
        ...memberUser,
      }),
      contact_information: contactInformation,
      addresses,
    }
  }
}
