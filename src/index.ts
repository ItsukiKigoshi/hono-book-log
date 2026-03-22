import {Hono} from "hono";
import {drizzle} from "drizzle-orm/d1";
import {books} from "./schema";
import {eq} from "drizzle-orm";

type Bindings = {
  hono_books_db: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => c.text("Hello Hono!"));
/**
 * books
 */
app.get("/books", async (c) => {
  const db = drizzle(c.env.hono_books_db);
  const result = await db.select().from(books).all();
  if (result.length === 0) {
    return c.json({ message: "no results" }, 404)
  }
  return c.json(result);
});

/**
 * create book
 */
app.post("/books", async (c) => {
  const params = await c.req.json<typeof books.$inferSelect>();
  const db = drizzle(c.env.hono_books_db);
  const result = await db
      .insert(books)
      .values({title: params.title})
      .execute();
  return c.json(result);
});

/**
 * update book
 */
app.put("/books/:id", async (c) => {
  const id = parseInt(c.req.param("id"));

  if (isNaN(id)) {
    return c.json({error: "invalid ID"}, 400);
  }

  const params = await c.req.json<typeof books.$inferSelect>();
  const db = drizzle(c.env.hono_books_db);
  const result = await db
      .update(books)
      .set({title: params.title, status: params.status})
      .where(eq(books.id, id));
  return c.json(result);
});

/**
 * delete book
 */
app.delete("/books/:id", async (c) => {
  const id = parseInt(c.req.param("id"));

  if (isNaN(id)) {
    return c.json({error: "invalid ID"}, 400);
  }

  const db = drizzle(c.env.hono_books_db);
  const result = await db.delete(books).where(eq(books.id, id));
  return c.json(result);
});

export default app;