import { Router } from "express";
import webhook from "./webbook/utils.routes";
import propertyRoute from "@routes/property/property.routes";
import inspectionRoutes from "@routes/property/inspection.routes";
import adminRoute from '@routes/admin/admin.routes'
import userRoutes from '@routes/userRoutes/user.routes'
import { authenticate } from '@routes/index.t'
import authRoutes from "@routes/authRoutes/auth.routes";
import { limiter } from "@middleware/security";
import managePropertyRoute from "@routes/admin/ManageProperty.routes";
import enquiryRoutes from "@routes/property/enquiry.routes";
import developerRoutes from "@routes/developer/developer.routes";
import preQualifierRoutes from "@routes/property/preQualifiier/prequalify.routes";
import propertyPurchaseRoutes from "./property/purchaseProperty.routes";




const routes: Router = Router()

routes.use('/developer', authenticate, limiter, developerRoutes)
routes.use('/pre-qualifier', authenticate, preQualifierRoutes)
routes.use('/enquiry', authenticate, limiter, enquiryRoutes)
routes.use('/property', propertyRoute)
routes.use('/purchase-property', authenticate, limiter, propertyPurchaseRoutes)
routes.use('/inspection', authenticate, limiter,  inspectionRoutes)
routes.use('/admin', authenticate,  limiter, adminRoute)
routes.use('/manage', authenticate, limiter, managePropertyRoute)
routes.use('/user', authenticate, limiter,   userRoutes)
routes.use('/auth',  authRoutes)
routes.use('/webhook', webhook)


export default routes

