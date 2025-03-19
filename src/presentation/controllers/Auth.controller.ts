import { ApiResponse, createResponse } from "../../presentation/response/responseType";
import { AuthService } from "../../application/useCases/Auth";
import { User } from "../../domain/entities/User";
import { StatusCodes } from "http-status-codes";
import { loginType, ResetPasswordType, veriftOtpType } from "../../domain/types/userType";



export class AuthController {
    constructor (private readonly authService: AuthService) {}

    public async registerUser (input: User): Promise<ApiResponse<any>> {
        const user = await this.authService.register(input)
        return createResponse(
            StatusCodes.CREATED,
            'user account created successfully',
            user
        )
    }

    public async verifyOtp(input: veriftOtpType): Promise<ApiResponse<any>> {
        await this.authService.verifyAccount(input.otp) 
        return createResponse(
            StatusCodes.OK,
            'OTP verified successfully'
        )
}

    public async login (input: loginType): Promise<ApiResponse<any>> {
        const user = await this.authService.login(input)
        return createResponse(
            StatusCodes.OK,
            'user logged in successfully',
            user
        )
    }

    public async verifyMfa (otp: string): Promise<ApiResponse<any>> {
        const user = await this.authService.verifyMfa(otp)
        return createResponse(
            StatusCodes.OK,
            'user logged in successfully',
            user
        )
    }

    public async resendOtp (email: string): Promise<ApiResponse<any>> {
        await this.authService.resendOtp(email)
        return createResponse(
            StatusCodes.OK,
            'OTP sent successfully'
        )
    }

    public async requestPasswordResetOtp (email: string): Promise<ApiResponse<any>> {
        await this.authService.requestPasswordReset(email)
        return createResponse(
            StatusCodes.OK,
            'OTP sent successfully'
        )
    }

    public async resetPasswordController (input: ResetPasswordType): Promise<any> {
        await this.authService.resetPassword(input)
        return createResponse(
            StatusCodes.OK,
            'Password reset successfully'
        )
    }


}