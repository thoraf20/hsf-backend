import { Router } from 'express'
import webhook from './webbook/utils.routes'
import propertyRoute from '@routes/property/property.routes'
import inspectionRoutes from '@routes/property/inspection.routes'
import agentsRoute from '@routes/Agents/agents.routes'
import userRoutes from '@routes/userRoutes/user.routes'
import { authenticate } from '@routes/index.t'
import authRoutes from '@routes/authRoutes/auth.routes'
import { limiter } from '@middleware/security'
import managePropertyRoute from '@routes/Agents/ManageProperty.routes'
import enquiryRoutes from '@routes/property/enquiry.routes'
import preQualifierRoutes from '@routes/property/preQualifiier/prequalify.routes'
import propertyPurchaseRoutes from './property/purchaseProperty.routes'
import serviceOfferingRoutes from '@routes/Agents/serviceOffering.routes'
import oauthRoutes from './authRoutes/oauth.routes'
import fileRoutes from './file/file.routes'
import manageAgentRoutes from './Agents/ManageAgent.routes'
import mfaRoutes from './userRoutes/mfa.routes'
import applicationRoutes from './application/application.routes'
import manageInspectionRoutes from './application/application.manage.routes'
import organizationRoutes from './organization/organization.routes'
import notificationRoutes from './userRoutes/notificationRoutes'
import manageUserRoutes from './userRoutes/user.manage.routes'
import developerIndexRoutes from './developer/developerIndex.routes'
import clientRoutes from './Agents/ManageClient.routes'
import managePaymentRoutes from './payments/managePayments.routes'
import manageLoanOfferRoutes from './Agents/ManageLoanOffer.routes'
import miscRoutes from './Misc/Misc.routes'
import manageLoanRoutes from './Agents/ManageLoan.routes'
import userAssignmentRoutes from './userRoutes/userAssignmentRoutes'
import manageLoanAgreementRoutes from './Agents/MAnageLoanAgreement.routes'

const routes: Router = Router()
routes.use('/user/mfa', authenticate, limiter, mfaRoutes)
routes.use('/auth', authRoutes)
routes.use('/oauth', oauthRoutes)
routes.use('/webhook', webhook)
routes.use('/pre-qualifier', authenticate, preQualifierRoutes)
routes.use('/enquiry', authenticate, limiter, enquiryRoutes)
routes.use('/property', propertyRoute)
routes.use('/purchase-property', authenticate, limiter, propertyPurchaseRoutes)
routes.use('/inspection', authenticate, limiter, inspectionRoutes)
routes.use('/agents', authenticate, limiter, agentsRoute)
routes.use('/manage', authenticate, limiter, managePropertyRoute)
routes.use('/user', authenticate, limiter, userRoutes)
routes.use('/applications', authenticate, limiter, applicationRoutes)
routes.use('/user-assignments', authenticate, limiter, userAssignmentRoutes)
routes.use('/file', fileRoutes)
routes.use('/service-offering', authenticate, limiter, serviceOfferingRoutes)
routes.use('/misc', authenticate, limiter, miscRoutes)
routes.use('/manage', authenticate, manageAgentRoutes)
routes.use('/manage', authenticate, limiter, manageInspectionRoutes)
routes.use('/manage', authenticate, limiter, manageUserRoutes)
routes.use('/manage', authenticate, limiter, managePaymentRoutes)
routes.use('/manage', authenticate, limiter, manageLoanRoutes)
routes.use('/manage', authenticate, limiter, manageLoanOfferRoutes)
routes.use('/manage', authenticate, limiter, manageLoanAgreementRoutes)
routes.use('/organizations', authenticate, limiter, organizationRoutes)
routes.use('/notifications', notificationRoutes)
routes.use('/manage-client', authenticate, clientRoutes)
routes.use('/', authenticate, limiter, developerIndexRoutes)
export default routes
