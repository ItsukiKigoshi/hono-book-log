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

export default app;