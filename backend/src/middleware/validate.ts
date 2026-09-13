import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { sendBadRequest } from '../utils/response';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      sendBadRequest(res, 'Validation failed', errors);
      return;
    }
    req.body = result.data;
    next();
  };
};
