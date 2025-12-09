import { Hono } from "hono";

const health = new Hono().get("/", (c) => {
  return c.json({ message: "OK" });
});

export default health;
