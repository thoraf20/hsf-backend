import 'dotenv/config'
import bcrypt from 'bcryptjs'
import configs from '../../config/config'
import Jwt from 'jsonwebtoken'
import { Role } from '../../domain/enums/rolesEmun'

const secret = process.env.SECRET_TOKEN as string | 'theSecretofDoom'
console.log(configs.salt.app_key)
export class Hashing {
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
    const access_key = this.jwt.sign({ id, role }, secret, {
      expiresIn: '1d',
    })
    return access_key
  }
}
