import { Request} from 'express'
import { StatusCodes } from 'http-status-codes'
import jwt from 'jsonwebtoken'
interface AuthRequest extends Request {
  user?: any;
}

const authenticate = (req: AuthRequest, res, next,) => {
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
    next();
  } catch (error) {
    res.status(StatusCodes.FORBIDDEN).json({
      ok: false,
      status: StatusCodes.FORBIDDEN,
      message: 'Invalid token.',
    });
  }
};

export { authenticate, AuthRequest };

 