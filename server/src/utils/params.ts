import type { Request } from "express";

/**
 * Helper per estrarre parametri numerici dalle route Express 5
 * (dove req.params[key] è string | string[]).
 */
export function paramId(req: Request, key = "id"): number {
  const val = req.params[key];
  return parseInt(Array.isArray(val) ? val[0] : val, 10);
}
