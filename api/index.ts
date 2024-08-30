import { Hono } from "hono";
import { handle } from "hono/vercel";
import { sql } from "@vercel/postgres";

export const config = {
  runtime: "edge",
};

const app = new Hono().basePath("/api");

app.get("/", async (c) => {
  const { rows } = await sql`SELECT * FROM posts WHERE likes > 100;`;
  return c.json({ message: "Hello Hono!" });
});

export default handle(app);
