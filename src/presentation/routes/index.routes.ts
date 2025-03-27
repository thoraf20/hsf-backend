import { Router } from "express";
import propertyRoutes from "./property/property.routes";
import inspectionRoutes from "./property/inspection.routes";
import adminRoute from './admin/admin.routes'
import userRoutes from './userRoutes/user.routes'
import { authenticate } from './index.t'
import authRoutes from "./authRoutes/auth.routes";
import { authLimiter, limiter } from "../../middleware/security";



const routes: Router = Router()

routes.use('/property', propertyRoutes)
routes.use('/inspection', authenticate, limiter,  inspectionRoutes)
routes.use('/admin', authenticate,  limiter, adminRoute)
routes.use('/user', authenticate, limiter,   userRoutes)
routes.use('/auth', authLimiter, limiter,  authRoutes)


export default routes

