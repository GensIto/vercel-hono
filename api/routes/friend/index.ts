import { zValidator } from "@hono/zod-validator";
import { sql } from "@vercel/postgres";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { jwt, decode } from "hono/jwt";
import { FRIEND_ADD_SCHEMA, FRIEND_SEARCH_SCHEMA } from "./schema";

export const FRIEND_ROUTERS = new Hono();
FRIEND_ROUTERS.use(
  "/*",
  jwt({
    secret: process.env.JWT_TOKEN_SECRET as string,
    cookie: "jwt_token",
  })
);

FRIEND_ROUTERS.get("/", async (c) => {
  try {
    const token = await getCookie(c, "jwt_token");
    if (!token) return c.json("Unauthorized", 401);
    const { payload } = decode(token);

    const result = await sql`SELECT * FROM friends WHERE user_id = ${
      payload.id as string
    }`;

    if (!result.rowCount || result.rowCount === 0) {
      return c.json({ error: "No friends found" }, 400);
    }

    return c.json(result.rows);
  } catch (error) {
    return c.json({ error: "Error fetching friends" }, 500);
  }
});

FRIEND_ROUTERS.post(
  "/search",
  zValidator("json", FRIEND_SEARCH_SCHEMA),
  async (c) => {
    try {
      const token = await getCookie(c, "jwt_token");
      if (!token) return c.json("Unauthorized", 401);

      const validated = c.req.valid("json");

      const { email } = validated;

      const result =
        await sql`SELECT id, name FROM users WHERE email = ${email}`;

      return c.json({ data: result.rows[0] });
    } catch (error) {
      return c.json({ error: "Error fetching friend" }, 500);
    }
  }
);

FRIEND_ROUTERS.post(
  "/add",
  zValidator("json", FRIEND_ADD_SCHEMA),
  async (c) => {
    try {
      const token = await getCookie(c, "jwt_token");
      if (!token) return c.json("Unauthorized", 401);

      const { payload } = decode(token);
      const validated = c.req.valid("json");

      const { id } = validated;

      const existFriend = await sql`SELECT * FROM friends WHERE user_id = ${
        payload.id as string
      } AND friend_id = ${id}`;

      if (existFriend.rowCount && existFriend.rowCount > 0) {
        return c.json({ error: "Friend already exists" }, 400);
      }

      await sql`INSERT INTO friends (user_id, friend_id) VALUES (${
        payload.id as string
      }, ${id})`;

      return c.json({ message: "Friend added" }, 201);
    } catch (error) {
      return c.json({ error: "Error adding friend" }, 500);
    }
  }
);
