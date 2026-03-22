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