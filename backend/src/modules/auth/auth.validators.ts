import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("A valid email is required").max(254),
  password: z.string().min(1, "Password is required").max(128),
});