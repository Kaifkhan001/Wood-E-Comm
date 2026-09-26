/* Promote an existing account to admin: npm run make-admin -- you@example.com */
import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

async function main() {
  const email = process.argv[2]?.toLowerCase().trim();
  if (!email) throw new Error("Usage: npm run make-admin -- email@example.com");
  const client = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false });
  const db = drizzle(client, { schema });
  const rows = await db.update(schema.user).set({ role: "admin" }).where(eq(schema.user.email, email)).returning({ id: schema.user.id });
  console.log(rows.length ? `${email} is now an admin.` : `No account found for ${email}. Sign up first.`);
  await client.end();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
