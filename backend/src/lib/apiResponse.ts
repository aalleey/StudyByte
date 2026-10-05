import { Response } from 'express';

interface ApiResponseBody<T> {
  success: boolean;
  data: T;
  message?: string;
}

function send<T>(res: Response, statusCode: number, data: T, message?: string): Response {
  const body: ApiResponseBody<T> = { success: true, data, message };
  return res.status(statusCode).json(body);
}

export function ok<T>(res: Response, data: T, message?: string): Response {
  return send(res, 200, data, message);
}

export function created<T>(res: Response, data: T, message?: string): Response {
  return send(res, 201, data, message);
}

export function noContent(res: Response): Response {
  return res.status(204).send();
}
