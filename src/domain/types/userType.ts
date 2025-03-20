export type ResetPasswordType = { 
    otp: string, 
    newPassword: string
}

export type loginType = {
    identifier: string
    password: string
}

export type veriftOtpType =  {
    otp: string
}

export type resetPassword = {
     oldPassword :  string 
     newPassword:  string
}