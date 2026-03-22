import { hc } from 'hono/client';

import type { AppType } from 'book-log-api/src';

export const client = hc<AppType>('http://localhost:8787');