import db from '@infrastructure/database/knex';
import { Request} from 'express'
import { StatusCodes } from 'http-status-codes'
import jwt from 'jsonwebtoken'
interface AuthRequest extends Request {
  user?: any;
  role?: string
}

const authenticate = async (req: AuthRequest, res, next,) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      ok: false,
      status: StatusCodes.UNAUTHORIZED,
      message: 'Access denied. No token provided.',
    });
  }

  try {
    const secret = process.env.SECRET_TOKEN!;
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    const user = await db('users').where({ id: req.user.id }).first(); // Adjust table/column names

    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        ok: false,
        status: StatusCodes.UNAUTHORIZED,
        message: 'Unauthorized Request.',
      });
    }
    
    next();
  } catch (error) {
    res.status(StatusCodes.FORBIDDEN).json({
      ok: false,
      status: StatusCodes.FORBIDDEN,
      message: 'Invalid token.',
    });
  }
};

export function optionalAuth(req: AuthRequest, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    req.user = { role: null }; 
    return next();
  }


  try {
    const decoded = jwt.verify(token, process.env.SECRET_TOKEN!);
    req.user = decoded; 
    next();
  } catch (error) {
    return res.status(401).json({  ok: false,
      status: StatusCodes.FORBIDDEN,
      message: 'Invalid token.', });
  }
}
export { authenticate, AuthRequest };

 