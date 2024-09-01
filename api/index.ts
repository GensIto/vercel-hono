import { Hono } from "hono";
import { logger } from "hono/logger";
import { handle } from "hono/vercel";

import { AUTH_ROUTERS } from "./routes/auth";
import { USERS_ROUTERS } from "./routes/users";
import { FRIEND_ROUTERS } from "./routes/friend";

export const config = {
  runtime: "edge",
};

export const app = new Hono().basePath("/api");
app.use(logger());

app.get("/", (c) => c.json({ message: "Hello World" }));

app.route("/auth", AUTH_ROUTERS);
app.route("/users", USERS_ROUTERS);
app.route("/friend", FRIEND_ROUTERS);

export default handle(app);
