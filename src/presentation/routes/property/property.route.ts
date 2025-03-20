import { PropertyRepository } from "../../../infrastructure/repositories/PropertyRepository";
import { PropertyService } from "../../../application/useCases/Property";
import { Router } from "express";
import { PropertyController } from "../../../presentation/controllers/Property.controller";
import { asyncMiddleware, validateRequest } from '../index.t'
import { PropertySchema } from "../../../domain/dto/propertyValidator";



const propertyRoute:  Router = Router();
const propertyRepo = new PropertyRepository()
const service = new PropertyService(propertyRepo);
const controller = new PropertyController(service);


propertyRoute.post('/create', validateRequest(PropertySchema), asyncMiddleware(async (req, res) =>  {
    const { body } = req
    const property = await controller.createProperty(body)
    res.status(property.statusCode).json(property)
}))

propertyRoute.get('/all', asyncMiddleware(async (req, res) => { 
    const properties = await controller.getAllProperties()
    res.status(properties.statusCode).json(properties)
}))

export default propertyRoute