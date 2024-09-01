import { sql } from "@vercel/postgres";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { jwt, decode } from "hono/jwt";

export const USERS_ROUTERS = new Hono();
USERS_ROUTERS.use(
  "/*",
  jwt({
    secret: process.env.JWT_TOKEN_SECRET as string,
    cookie: "jwt_token",
  })
);

USERS_ROUTERS.get("/me", async (c) => {
  try {
    const token = await getCookie(c, "jwt_token");
    if (!token) return c.json("Unauthorized", 401);
    const { payload } = decode(token);

    const result = await sql`SELECT id, name, email FROM users WHERE email = ${
      payload.email as string
    }`;

    return c.json({ data: result.rows[0] });
  } catch (error) {
    return c.json({ error: "Error fetching me" }, 500);
  }
});
