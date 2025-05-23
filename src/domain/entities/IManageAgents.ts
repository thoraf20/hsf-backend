import { DevelopeReg } from './Developer'
import { LenderProfile } from './Lender'
import { AgentProfile, User } from './User'

export type AgentsInformation = User &
  AgentProfile &
  DevelopeReg &
  LenderProfile
