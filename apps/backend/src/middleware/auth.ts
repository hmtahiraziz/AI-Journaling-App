import type { Request, Response, NextFunction } from "express";
import { AppError } from "./error";
import { verifyAccessToken } from "../lib/tokens";

export type AuthRequest = Request & {
  user?: { userId: string; email: string };
};

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError(401, "Unauthorized"));
  }
  try {
    const token = header.slice(7);
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(new AppError(401, "Invalid or expired token"));
  }
}
