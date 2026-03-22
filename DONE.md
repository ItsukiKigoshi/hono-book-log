# やったことメモ
## Installation

```bash
$ bun create hono@latest hono-book-log
$ bun add zod @hono/zod-openapi @hono/swagger-ui 
```
https://zenn.dev/praha/articles/d1d6462a27e37e
https://qiita.com/kaiparu/items/88ae7c11fb45b82b447a

```bash
$ bun add drizzle-orm
$ bun add -D drizzle-kit @cloudflare/workers-types wrangler
bunx wrangler login
```

```ts : drizzle.config.ts
import {defineConfig} from 'drizzle-kit';

export default defineConfig({
    schema: './src/schema.ts',
    out: './migrations',
    dialect: 'sqlite',
    /*driver: 'd1-http',*/
    dbCredentials: {
        url: '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/local.sqlite',
        /*accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
        databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
        token: process.env.CLOUDFLARE_D1_TOKEN!,*/
    },
});
```

```ts : src/schema.ts
import {sqliteTable, integer, text} from "drizzle-orm/sqlite-core";

export const books = sqliteTable("books", {
    id: integer("id", {mode: "number"}).primaryKey({autoIncrement: true}),
    title: text("title").notNull(),
    comment: text("comment"),
    isFavorite: integer("is_favorite", {mode: "boolean"}).default(false),
    status: text("status", {enum: ["toRead", "reading", "read"]}).default("toRead"),
    createdAt: integer("created_at", {mode: "timestamp"})
        .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", {mode: "timestamp"})
        .$defaultFn(() => new Date()),
});
```

```bash
$ bunx wrangler d1 create hono-books-db
$ bunx drizzle-kit generate
```

wrangler.jsoncが生成されなかったので手動で追加
```jsonc : wrangler.jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "hono-book-log",
  "main": "src/index.ts",
  "compatibility_date": "2026-03-21",
  "d1_databases": [
    {
      "binding": "hono_books_db",
      "database_name": "hono-books-db",
      "database_id": "f19352de-c69e-4844-bb72-28a96086a895",
      "migrations_dir": "./migrations"
    }
  ]
}
```

```bash
$ bunx wrangler d1 migrations apply hono-books-db --local
```

```jsonc: tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "types": [
      "@cloudflare/workers-types" // これを追加
    ],
    "jsx": "react-jsx",
    "jsxImportSource": "hono/jsx"
  }
}
```

## まずは取得

```ts : src/index.ts
import {Hono} from "hono";
import {drizzle} from "drizzle-orm/d1";
import {todos} from "./schema";
import {eq} from "drizzle-orm";

type Bindings = {
    hono_todo_db: D1Database; // "hono_todo_db"の部分は, wrangler.jsoncのd1_databases/bindingと一致させる!
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => c.text("Hello This is Itsuki's Bookshelf!"));

app.get("/books", async (c) => {
    const db = drizzle(c.env.hono_todo_db);
    const result = await db.select().from(todos).all();
    if (result.length === 0) {
        return c.json({ message: "no results" }, 404)
    }
    return c.json(result);
});



```

```bash
$ bunx wrangler dev
```

## Add Zod and OpenAPI for Debug

https://orm.drizzle.team/docs/zod

- [ ] TODO - Replace drizzle-zod with @drizzle-orm/zod
```
Starting from drizzle-orm@1.0.0-beta.15, drizzle-zod has been deprecated in favor of first-class schema generation support within Drizzle ORM itself.
You can still use drizzle-zod package but all new update will be added to Drizzle ORM directly.
```
```bash
$ bun add -D @hono/zod-openapi @hono/swagger-ui drizzle-zod
```
```ts : src/schema.ts
import {sqliteTable, integer, text} from "drizzle-orm/sqlite-core";
import {createInsertSchema, createSelectSchema} from "drizzle-zod";
// Add imports
import { z } from "@hono/zod-openapi";
import { extendZodWithOpenApi } from "@hono/zod-openapi";

export const books = sqliteTable("books", {
    id: integer("id", {mode: "number"}).primaryKey({autoIncrement: true}),
    title: text("title").notNull(),
    comment: text("comment"),
    isFavorite: integer("is_favorite", {mode: "boolean"}).default(false),
    status: text("status", {enum: ["toRead", "reading", "read"]}).default("toRead"),
    createdAt: integer("created_at", {mode: "timestamp"})
        .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", {mode: "timestamp"})
        .$defaultFn(() => new Date()),
});
// Add the lines below
extendZodWithOpenApi(z);

// By omit, those fields are ignored because they are auto-generated
export const insertBookSchema = createInsertSchema(books)
    .omit({
        id: true,
        createdAt: true,
        updatedAt: true
    })
    .openapi("InsertBook");
export const selectBookSchema = createSelectSchema(books)
    .openapi("SelectBook");
export const BookIdParamSchema = z.object({
    id: z
        .string()
        .regex(/^\d+$/, "ID must be a number")
        .transform(Number)
        .openapi({ example: "1" })
});
```

Add src/index.routes.ts

```ts : src/index.routes.ts
import { createRoute } from "@hono/zod-openapi";
import {BookIdParamSchema, insertBookSchema, selectBookSchema} from "./schema";
import { z } from "@hono/zod-openapi";

export const getBooksRoute = createRoute({
    method: 'get',
    path: '/books',
    responses: {
        200: { content: { 'application/json': { schema: z.array(selectBookSchema) } }, description: 'Retrieve book list' },
        404: { content: { 'application/json': { schema: z.object({ message: z.string() }) } }, description: 'No books found' }
    },
});

export const postBookRoute = createRoute({
    method: 'post',
    path: '/books',
    request: {
        body: { content: { 'application/json': { schema: insertBookSchema } } }
    },
    responses: {
        200: { content: { 'application/json': { schema: z.any() } }, description: 'Book created' }
    },
});

export const putBookRoute = createRoute({
    method: 'put',
    path: '/books/{id}',
    request: {
        params: BookIdParamSchema,
        body: { content: { 'application/json': { schema: insertBookSchema } } }
    },
    responses: {
        200: {content: {'application/json': {schema: z.any()}}, description: 'Book updated'},
    },
});

export const deleteBookRoute = createRoute({
    method: 'delete',
    path: '/books/{id}',
    request: {
        params: BookIdParamSchema
    },
    responses: {
        200: { content: { 'application/json': { schema: z.any() } }, description: 'Book deleted' }
    },
});
```

Update src/index.ts

```ts : src/index.ts
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

app.get("/", (c) => c.text("Hello This is Itsuki's Bookshelf!"));

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
```