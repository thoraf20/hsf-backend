import { StatusCodes } from 'http-status-codes'
import { UserAssignmentService } from '@use-cases/User/UserAssignment'
import { createResponse } from '@presentation/response/responseType'

export class UserAssignmentController {
  constructor(private readonly userAssignmentService: UserAssignmentService) {}

  async getAssignmentById(assignmentId: string) {
    const assignment =
      await this.userAssignmentService.getAssignmentById(assignmentId)
    return createResponse(
      StatusCodes.OK,
      'User assignment retrieved successfully',
      assignment,
    )
  }

  // async getAssignmentsByAssignable(req: Request, res: Response): Promise<void> {
  //   const { assignableId, assignableType } = req.params
  //   const filters = req.query as UserAssignmentFilters

  //   try {
  //     if (
  //       !Object.values(AssignableType).includes(
  //         assignable_type as AssignableType,
  //       )
  //     ) {
  //       res
  //         .status(StatusCodes.BAD_REQUEST)
  //         .json({ message: 'Invalid assignable_type provided.' })
  //       return
  //     }
  //     const assignments =
  //       await this.userAssignmentService.getAssignmentsByAssignable(
  //         assignableId,
  //         assignableType as AssignableType,
  //         filters,
  //       )
  //     res.status(StatusCodes.OK).json(assignments)
  //   } catch (error: any) {
  //     res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
  //       message:
  //         error.message ||
  //         'Failed to retrieve assignments for assignable entity.',
  //     })
  //   }
  // }

  // async getAssignmentsByUser(userId: string): Promise<void> {
  //   const { userId } = req.params
  //   const filters = req.query as UserAssignmentFilters

  //   try {
  //     const assignments = await this.userAssignmentService.getAssignmentsByUser(
  //       userId,
  //       filters,
  //     )
  //     res.status(StatusCodes.OK).json(assignments)
  //   } catch (error: any) {
  //     res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
  //       message: error.message || 'Failed to retrieve assignments for user.',
  //     })
  //   }
  // }

  // async getCurrentAssignment(req: Request, res: Response): Promise<void> {
  //   const { assignableId, assignableType } = req.params
  //   const { role } = req.query // role is optional here

  //   try {
  //     if (
  //       !Object.values(AssignableType).includes(
  //         assignable_type as AssignableType,
  //       )
  //     ) {
  //       res
  //         .status(StatusCodes.BAD_REQUEST)
  //         .json({ message: 'Invalid assignable_type provided.' })
  //       return
  //     }
  //     if (
  //       role &&
  //       !Object.values(UserAssignmentRole).includes(role as UserAssignmentRole)
  //     ) {
  //       res
  //         .status(StatusCodes.BAD_REQUEST)
  //         .json({ message: 'Invalid role provided.' })
  //       return
  //     }

  //     const assignment = await this.userAssignmentService.getCurrentAssignment(
  //       assignableId,
  //       assignableType as AssignableType,
  //       role as UserAssignmentRole,
  //     )

  //     if (!assignment) {
  //       res
  //         .status(StatusCodes.NOT_FOUND)
  //         .json({ message: 'No current assignment found.' })
  //       return
  //     }
  //     res.status(StatusCodes.OK).json(assignment)
  //   } catch (error: any) {
  //     res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
  //       message: error.message || 'Failed to retrieve current assignment.',
  //     })
  //   }
  // }

  // async getAllAssignments(req: Request, res: Response): Promise<void> {
  //   const filters = req.query as UserAssignmentFilters
  //   try {
  //     const assignments =
  //       await this.userAssignmentService.getAllAssignments(filters)
  //     res.status(StatusCodes.OK).json(assignments)
  //   } catch (error: any) {
  //     res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
  //       message: error.message || 'Failed to retrieve all user assignments.',
  //     })
  //   }
  // }
}
