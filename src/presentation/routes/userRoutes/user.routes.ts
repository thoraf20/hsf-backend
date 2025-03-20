import { Router, Request, Response } from "express";
import { asyncMiddleware, validateRequest } from '../index.t'
import { UserController } from "../../../presentation/controllers/User.controller";
import { UserService } from "../../../application/useCases/User";
import { UserRepository } from "../../../infrastructure/repositories/UserRepository";
import {
    updatePasswordSchema,
    updateProfileSchema,
    verifyOtpSchema
  } from '../../../domain/dto/userValidator'
const userRoutes: Router = Router();
const userRepo = new UserRepository
const userServices = new UserService(userRepo);
const userController = new UserController(userServices);


userRoutes.put('/update', validateRequest(updateProfileSchema), asyncMiddleware(async (req: Request, res: Response) => {
    const { body, user } = req;
    const userUpdate = await userController.update(body, user.id);
    return res.status(userUpdate.statusCode).json(userUpdate); 
}));


userRoutes.post('/verify-update', validateRequest(verifyOtpSchema), asyncMiddleware(async (req, res) => {
    const { body } = req
    const userUpdate = await userController.verifyUpdate(body.otp)
    res.status(userUpdate.statusCode).json(userUpdate)
}))

userRoutes.put('/reset-password', validateRequest(updatePasswordSchema), asyncMiddleware(async (req, res) => {
    const { body, user } = req
    const updatePassword = await userController.resetPassword(body, user.id)
    res.status(updatePassword.statusCode).json(updatePassword)
}))

userRoutes.put('/enable-mfa', asyncMiddleware(async (req, res) => {
    const { user } = req
    const enableMfa = await userController.enableMfa(user.id)
    res.status(enableMfa.statusCode).json(enableMfa)
}))

export default userRoutes;