import { zValidator } from "@hono/zod-validator";
import { sql } from "@vercel/postgres";
import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { sign } from "hono/jwt";
import { REGISTER_SCHEMA, LOGIN_SCHEMA } from "./schema";

export const AUTH_ROUTERS = new Hono();

AUTH_ROUTERS.post("/login", zValidator("json", LOGIN_SCHEMA), async (c) => {
  try {
    const { email, password } = c.req.valid("json");
    const existUser =
      await sql`SELECT * FROM users WHERE email = ${email} AND password = ${password}`;
    if (!existUser.rowCount || existUser.rowCount === 0) {
      return c.json({ error: "User not found" }, 400);
    }

    const token = await sign(
      { id: existUser.rows[0].id, email },
      process.env.JWT_TOKEN_SECRET as string
    );
    await setCookie(c, "jwt_token", token, {
      path: "/",
      httpOnly: true,
    });
    return c.json({ message: "Logged in" });
  } catch (error) {
    return c.json({ error: "Failed to log in. Please try again later." }, 500);
  }
});

AUTH_ROUTERS.post(
  "/register",
  zValidator("json", REGISTER_SCHEMA),
  async (c) => {
    try {
      const validated = c.req.valid("json");
      const { name, email, password } = validated;

      const existUser = await sql`SELECT * FROM users WHERE email = ${email}`;
      if (existUser.rowCount && existUser.rowCount > 0) {
        return c.json({ error: "User already exists" }, 400);
      }

      await sql`INSERT INTO users (name, email, password) VALUES (${name}, ${email}, ${password})`;
      const user = await sql`SELECT * FROM users WHERE email = ${email}`;

      const token = await sign(
        { id: user.rows[0].id, email },
        process.env.JWT_TOKEN_SECRET as string
      );
      await setCookie(c, "jwt_token", token, {
        path: "/",
        httpOnly: true,
      });

      return c.json({ message: "User created" });
    } catch (error) {
      return c.json({ error: "Error registering" }, 500);
    }
  }
);

AUTH_ROUTERS.get("/logout", async (c) => {
  await deleteCookie(c, "jwt_token");
  return c.json({ message: "Logged out" });
});
