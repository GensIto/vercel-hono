import { z } from "zod";

export const USER_SCHEMA = z.object({
  username: z.string(),
  email: z.string().email(),
});

export type User = z.infer<typeof USER_SCHEMA>;
