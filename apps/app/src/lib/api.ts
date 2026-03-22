import {hc} from 'hono/client';
import type {AppType} from 'book-log-api/src';

const API_URL = import.meta.env.VITE_API_URL || 'https://hono-book-log.itsukikigoshi.workers.dev';

export const client = hc<AppType>(API_URL);