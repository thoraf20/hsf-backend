import { Router } from 'express'
import webhook from './webbook/utils.routes'
import propertyRoute from '@routes/property/property.routes'
import inspectionRoutes from '@routes/property/inspection.routes'
import agentsRoute from '@routes/Super Admin/super_admin.routes'
import userRoutes from '@routes/userRoutes/user.routes'
import { authenticate } from '@routes/index.t'
import authRoutes from '@routes/authRoutes/auth.routes'
import { limiter } from '@middleware/security'
import managePropertyRoute from '@routes/Super Admin/ManageProperty.routes'
import enquiryRoutes from '@routes/property/enquiry.routes'
import developerRoutes from '@routes/developer/developer.routes'
import preQualifierRoutes from '@routes/property/preQualifiier/prequalify.routes'
import propertyPurchaseRoutes from './property/purchaseProperty.routes'
import serviceOfferingRoutes from '@routes/Super Admin/serviceOffering.routes'
import oauthRoutes from './authRoutes/oauth.routes'
import fileRoutes from './file/file.routes'

const routes: Router = Router()

routes.use('/developer', authenticate, limiter, developerRoutes)
routes.use('/pre-qualifier', authenticate, preQualifierRoutes)
routes.use('/enquiry', authenticate, limiter, enquiryRoutes)
routes.use('/property', propertyRoute)
routes.use('/purchase-property', authenticate, limiter, propertyPurchaseRoutes)
routes.use('/inspection', authenticate, limiter, inspectionRoutes)
routes.use('/agents', authenticate, limiter, agentsRoute)
routes.use('/manage', authenticate, limiter, managePropertyRoute)
routes.use('/user', authenticate, limiter, userRoutes)
routes.use('/auth', authRoutes)
routes.use('/oauth', oauthRoutes)
routes.use('/webhook', webhook)
routes.use('/file', fileRoutes)
routes.use('/service-offering', authenticate, limiter, serviceOfferingRoutes)

export default routes
