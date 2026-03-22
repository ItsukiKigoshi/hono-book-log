import {sqliteTable, integer, text} from "drizzle-orm/sqlite-core";
import {createInsertSchema, createSelectSchema} from "drizzle-zod";
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
