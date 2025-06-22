import { IUserAssignmentRepository } from '@domain/interfaces/IUserAssignmentRepository'
import { SeekPaginationResult } from '@shared/types/paginate'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { StatusCodes } from 'http-status-codes'
import { getUserClientView, UserAssignment } from '@entities/User'
import { AssignableType, UserAssignmentRole } from '@domain/enums/userEum'
import { UserAssignmentFilters } from '@validators/userValidator'
import { IUserRepository } from '@interfaces/IUserRepository'

export class UserAssignmentService {
  constructor(
    private readonly userAssignmentRepository: IUserAssignmentRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async getAssignmentById(id: string) {
    const assignment = await this.userAssignmentRepository.findById(id)
    if (!assignment) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'User assignment not found.',
      )
    }

    const user = await this.userRepository.findById(assignment.user_id)
    return { ...assignment, user: user ? getUserClientView(user) : null }
  }

  async getAssignmentsByAssignable(
    assignableId: string,
    assignableType: AssignableType,
    filters?: UserAssignmentFilters,
  ): Promise<SeekPaginationResult<UserAssignment>> {
    return this.userAssignmentRepository.findByAssignable(
      assignableId,
      assignableType,
      filters,
    )
  }

  async getAssignmentsByUser(
    userId: string,
    filters?: UserAssignmentFilters,
  ): Promise<SeekPaginationResult<UserAssignment>> {
    return this.userAssignmentRepository.findByUser(userId, filters)
  }

  async getCurrentAssignment(
    assignableId: string,
    assignableType: AssignableType,
    role?: UserAssignmentRole,
  ): Promise<UserAssignment | null> {
    const assignment =
      await this.userAssignmentRepository.findCurrentAssignment(
        assignableId,
        assignableType,
        role,
      )
    if (!assignment) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Assignment user not found',
      )
    }
    return assignment
  }

  async getAllAssignments(
    filters?: UserAssignmentFilters,
  ): Promise<SeekPaginationResult<UserAssignment>> {
    return this.userAssignmentRepository.getAll(filters)
  }
}
