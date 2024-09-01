import { z } from "zod";

export const REGISTER_SCHEMA = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
});

export type RegisterSchema = z.infer<typeof REGISTER_SCHEMA>;

export const LOGIN_SCHEMA = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type LoginSchema = z.infer<typeof LOGIN_SCHEMA>;
