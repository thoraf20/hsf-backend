import { Router } from "express";
import propertyRoutes from "./property/property.routes";
import inspectionRoutes from "./property/inspection.routes";
import adminRoute from './admin/admin.routes'
import userRoutes from './userRoutes/user.routes'
import { authenticate } from './index.t'
import authRoutes from "./authRoutes/auth.routes";



const routes: Router = Router()

routes.use('/property', propertyRoutes)
routes.use('/inspection', authenticate, inspectionRoutes)
routes.use('/admin', authenticate, adminRoute)
routes.use('/user', authenticate, userRoutes)
routes.use('/auth', authRoutes)


export default routes

