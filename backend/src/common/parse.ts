import { z } from "zod";
import { ApiError } from "./api.error.js";

// checks the data with Zod, and throws a 400 error if it is not valid
export function parse<T extends z.ZodType>(
  schema: T,
  data: unknown,
): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) throw ApiError.badRequest(z.prettifyError(result.error));
  return result.data;
}
