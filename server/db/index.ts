import { drizzle } from 'drizzle-orm/node-postgres';

import * as schema from "./schema";

const connectionString = useRuntimeConfig().databaseUrl;
export const db = drizzle(connectionString, { schema });
