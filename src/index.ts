import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { drizzle } from "drizzle-orm/d1";
import { books } from "./schema";
import { eq } from "drizzle-orm";
import {deleteBookRoute, getBooksRoute, postBookRoute, putBookRoute } from "./index.routes";

type Bindings = {
  hono_books_db: D1Database;
};

const app = new OpenAPIHono<{ Bindings: Bindings }>();

app.get("/", (c) => c.text("Hello Hono!"));

app.openapi(getBooksRoute, async (c) => {
  const db = drizzle(c.env.hono_books_db);
  const result = await db.select().from(books).all();
  if (result.length === 0) {
    return c.json({ message: "no results" }, 404);
  }
  return c.json(result, 200);
});

app.openapi(postBookRoute, async (c) => {
  const params = c.req.valid("json");
  const db = drizzle(c.env.hono_books_db);

  const result = await db.insert(books).values(params).execute();
  return c.json(result, 200);
});

app.openapi(putBookRoute, async (c) => {
  const { id } = c.req.valid("param");

  const db = drizzle(c.env.hono_books_db);
  const result = await db
      .update(books)
      .set({ ...c.req.valid("json"), updatedAt: new Date() })
      .where(eq(books.id, id))
      .run();

  return c.json(result, 200);
});

app.openapi(deleteBookRoute, async (c) => {
  const { id } = c.req.valid("param");

  const db = drizzle(c.env.hono_books_db);
  const result = await db.delete(books).where(eq(books.id, id)).execute();

  return c.json(result, 200);
});

app.doc("/doc", {
  openapi: "3.0.0",
  info: { title: "Books API", version: "1.0.0" },
});

app.get("/ui", swaggerUI({ url: "/doc" }));

export default app;
