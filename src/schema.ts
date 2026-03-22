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