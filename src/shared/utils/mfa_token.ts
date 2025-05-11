import 'dotenv/config'
import bcrypt from 'bcryptjs'
import configs from '@config/config'
import Jwt from 'jsonwebtoken'
import { Role } from '@domain/enums/rolesEmun'
import { getEnv } from '@infrastructure/config/env/env.config'

export class MfaToken {
  private readonly bcrHash = bcrypt
  private readonly jwt = Jwt
  constructor() {}

  public async hashing(data: string): Promise<string> {
    const key: number = Number(configs.salt.app_key)
    const salt = await this.bcrHash.genSalt(key)
    const bcrypt = this.bcrHash.hashSync(data, salt)
    return bcrypt
  }
  public async verifyHash(userData: string, hashedData: string) {
    const verify = await this.bcrHash.compare(userData, hashedData)
    return verify
  }

  public async accessCode(id: string, role: Role): Promise<string> {
    const access_key = this.jwt.sign({ id, role }, getEnv('MFA_SECRET_KEY'), {
      expiresIn: '1d',
    })
    return access_key
  }

  public async verifyCode(token: string) {
    try {
      const decoded = this.jwt.verify(token, getEnv('MFA_SECRET_KEY'))
      return decoded as { id: string; role: Role }
    } catch {
      return null
    }
  }
}
