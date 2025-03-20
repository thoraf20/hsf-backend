import { Router } from "express";
import authRoutes from "./authRoutes/auth.routes";
import propertyRoute from "./property/property.route";
import adminRoute from "./admin/admin.routes";
import userRoutes from "./userRoutes/user.routes";
import { authenticate } from './index.t'


const IndexRouters: Router = Router()

IndexRouters.use('/auth', authRoutes)
IndexRouters.use('/property', propertyRoute)
IndexRouters.use('/admin', authenticate, adminRoute)
IndexRouters.use('/user',  authenticate,userRoutes)


export default IndexRouters