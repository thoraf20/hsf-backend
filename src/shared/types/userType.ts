export type ResetPasswordType = { 
    tempId: string, 
    newPassword: string
}

export type loginType = {
    identifier: string
    password: string
}

export type veriftOtpType =  {
    otp: string
}

export type changePassword = {
     oldPassword :  string 
     newPassword:  string
}