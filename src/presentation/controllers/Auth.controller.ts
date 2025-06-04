import {
  ApiResponse,
  createResponse,
} from '@presentation/response/responseType'
import { AuthService } from '@application/useCases/Auth/Auth'
import { User } from '@domain/entities/User'
import { StatusCodes } from 'http-status-codes'
import {
  loginType,
  ResetPasswordType,
  veriftOtpType,
} from '@shared/types/userType'
import { MfaFlow } from '@domain/enums/userEum'
import { ApplicationCustomError } from '@middleware/errors/customError'

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  public async registerEmail(
    input: Record<string, any>,
  ): Promise<ApiResponse<any>> {
    await this.authService.checkRegisterEmail(input)
    return createResponse(
      StatusCodes.CREATED,
      'Please verify your email before you  ontinue',
      {},
    )
  }

  public async registerUser(
    input: Omit<User, 'email' | 'tempId'> & { tempId: string },
  ): Promise<ApiResponse<any>> {
    const user = await this.authService.register(input)
    return createResponse(
      StatusCodes.CREATED,
      'user account created successfully',
      user,
    )
  }

  public async verifyOtp(input: veriftOtpType): Promise<ApiResponse<any>> {
    const regDetails = await this.authService.verifyAccount(input.otp)
    return createResponse(
      StatusCodes.OK,
      'OTP verified successfully',
      regDetails,
    )
  }

  public async login(input: loginType): Promise<ApiResponse<any>> {
    const user = await this.authService.login(input, false)
    delete user.password
    return createResponse(StatusCodes.OK, 'user logged in successfully', user)
  }

  public async loginAdmin(input: loginType): Promise<ApiResponse<any>> {
    const user = await this.authService.login(input, true)
    delete user.password
    return createResponse(StatusCodes.OK, 'user logged in successfully', user)
  }

  public async verifyMfa(
    otp: string,
    userId: string,
    flow: MfaFlow,
  ): Promise<ApiResponse<any>> {
    const user = await this.authService.verifyMfa(otp, userId, flow)
    return createResponse(StatusCodes.OK, 'user logged in successfully', user)
  }

  public async sendMfaOtp(userId: string) {
    await this.authService.sendMfaEmailOtp(userId)
    return createResponse(StatusCodes.OK, 'Otp send to your email successfully')
  }

  public async resendOtp(email: string): Promise<ApiResponse<any>> {
    await this.authService.resendOtp(email)
    return createResponse(StatusCodes.OK, 'OTP sent successfully')
  }

  public async requestPasswordResetOtp(
    email: string,
  ): Promise<ApiResponse<any>> {
    const foundUser = await this.authService.requestPasswordReset(email)

    if (!foundUser) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'No account found with this email, Try again!',
      )
    }

    return createResponse(
      StatusCodes.OK,
      'Otp will be sent to this email if this account exist',
    )
  }

  public async resetPasswordController(input: ResetPasswordType): Promise<any> {
    await this.authService.resetPassword(input)
    return createResponse(StatusCodes.OK, 'Password reset successfully')
  }
}
