import { sign } from "hono/jwt";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { decode, jwt } from "hono/jwt";
import { handle } from "hono/vercel";
import { sql } from "@vercel/postgres";
import { zValidator } from "@hono/zod-validator";
import { USER_SCHEMA } from "./schema";

export const config = {
  runtime: "edge",
};

const app = new Hono().basePath("/api");

const JWT_TOKEN = "SECRET";

app.use(logger());

app.post("/login", zValidator("json", USER_SCHEMA), async (c) => {
  try {
    const { username, email } = c.req.valid("json");
    const existUser =
      await sql`SELECT * FROM users WHERE email = ${email} AND username = ${username}`;
    if (!existUser.rowCount || existUser.rowCount === 0) {
      return c.json({ error: "User not found" }, 400);
    }

    const token = await sign({ username, email }, JWT_TOKEN);
    await setCookie(c, "jwt_token", token);
    return c.json({ message: "Logged in" });
  } catch (error) {
    return c.json("Error fetching users", 500);
  }
});

app.post("/register", zValidator("json", USER_SCHEMA), async (c) => {
  try {
    const validated = c.req.valid("json");
    const { username, email } = validated;

    const existUser = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (existUser.rowCount && existUser.rowCount > 0) {
      return c.json({ error: "User already exists" }, 400);
    }

    await sql`INSERT INTO users (username, email) VALUES (${username}, ${email})`;
    const token = await sign({ username, email }, JWT_TOKEN);
    await setCookie(c, "jwt_token", token);

    return c.json({ message: "User created" });
  } catch (error) {
    return c.text("Error creating user", 500);
  }
});

app.get("/logout", async (c) => {
  await deleteCookie(c, "jwt_token");
  return c.json({ message: "Logged out" });
});

app.use(
  "/users/*",
  jwt({
    secret: JWT_TOKEN,
    cookie: "jwt_token",
  })
);

app.get("/users", async (c) => {
  try {
    const token = await getCookie(c, "jwt_token");
    if (!token) return c.json("Unauthorized", 401);

    const result = await sql`SELECT * FROM users`;
    return c.json(result.rows);
  } catch (error) {
    return c.json("Error fetching users", 500);
  }
});

app.get("/users/me", async (c) => {
  try {
    const token = await getCookie(c, "jwt_token");
    if (!token) return c.json("Unauthorized", 401);
    const { payload } = decode(token);

    const result = await sql`SELECT * FROM users WHERE email = ${
      payload.email as string
    } AND username = ${payload.username as string}`;

    return c.json(result.rows);
  } catch (error) {
    return c.json("Error fetching users", 500);
  }
});

export default handle(app);
