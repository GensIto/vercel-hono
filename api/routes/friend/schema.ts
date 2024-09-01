import { z } from "zod";

export const FRIEND_ADD_SCHEMA = z.object({
  id: z.string().uuid(),
});

export type FriendAddSchema = z.infer<typeof FRIEND_ADD_SCHEMA>;

export const FRIEND_SEARCH_SCHEMA = z.object({
  email: z.string().email(),
});

export type FriendSearchSchema = z.infer<typeof FRIEND_SEARCH_SCHEMA>;
