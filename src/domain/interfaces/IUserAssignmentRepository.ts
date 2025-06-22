import { UserAssignment } from '@entities/User'
import { SeekPaginationResult } from '@shared/types/paginate'
import { UserAssignmentFilters } from '@validators/userValidator'

export interface IUserAssignmentRepository {
  /**
   * Creates a new user assignment record.
   * @param assignment The UserAssignment entity to create.
   * @returns The created UserAssignment entity.
   */
  create(assignment: UserAssignment): Promise<UserAssignment>

  /**
   * Finds a user assignment by its unique ID.
   * @param id The ID of the assignment.
   * @returns The UserAssignment entity if found, otherwise null.
   */
  findById(id: string): Promise<UserAssignment | null>

  /**
   * Finds all assignments for a specific assignable entity (e.g., all loan officers for an application).
   * @param assignableId The ID of the entity (e.g., application_id, task_id).
   * @param assignableType The type of the entity (e.g., 'Application', 'Task').
   * @param filters Optional filters for pagination and other criteria.
   * @returns A paginated list of UserAssignment entities.
   */
  findByAssignable(
    assignableId: string,
    assignableType: string,
    filters?: UserAssignmentFilters,
  ): Promise<SeekPaginationResult<UserAssignment>>

  /**
   * Finds all assignments for a specific user.
   * @param userId The ID of the user.
   * @param filters Optional filters for pagination and other criteria.
   * @returns A paginated list of UserAssignment entities.
   */
  findByUser(
    userId: string,
    filters?: UserAssignmentFilters,
  ): Promise<SeekPaginationResult<UserAssignment>>

  /**
   * Finds the current active assignment for a specific assignable entity and optionally a specific role.
   * A "current" assignment is one where `unassigned_at` is null.
   * @param assignableId The ID of the entity.
   * @param assignableType The type of the entity.
   * @param role Optional: The role of the user in the assignment (e.g., 'LoanOfficer').
   * @returns The current UserAssignment entity if found, otherwise null.
   */
  findCurrentAssignment(
    assignableId: string,
    assignableType: string,
    role?: string,
  ): Promise<UserAssignment | null>

  /**
   * Updates an existing user assignment record.
   * @param id The ID of the assignment to update.
   * @param updates The partial UserAssignment entity with updated fields.
   * @returns The updated UserAssignment entity if found, otherwise null.
   */
  update(
    id: string,
    updates: Partial<UserAssignment>,
  ): Promise<UserAssignment | null>

  /**
   * Deletes a user assignment record.
   * @param id The ID of the assignment to delete.
   */
  delete(id: string): Promise<void>

  /**
   * Retrieves all user assignments with optional filters and pagination.
   * @param filters Optional filters for the query.
   * @returns A paginated list of UserAssignment entities.
   */
  getAll(
    filters?: UserAssignmentFilters,
  ): Promise<SeekPaginationResult<UserAssignment>>
}
