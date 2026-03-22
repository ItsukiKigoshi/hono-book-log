# やったことメモ
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

## Add Zod and OpenAPI for Development
```bash
$ bun　add -D　@drizzle-orm/zod @hono/zod-openapi @hono/swagger-ui
```
