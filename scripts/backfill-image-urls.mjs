#!/usr/bin/env node
// Fills `url` for product_images rows that only have a publicId -- rows saved
// before the upload flow started storing Cloudinary's secure_url too. Those
// rows already render fine as long as NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is
// correct at build time; this makes them independent of that build-time
// variable, same as every image uploaded after the fix.
//
// Dry-run by default. Re-run with --apply to write changes.
//   node scripts/backfill-image-urls.mjs
//   node scripts/backfill-image-urls.mjs --apply
import { config } from "dotenv";
config({ path: ".env.local" });
config();
import postgres from "postgres";

const APPLY = process.argv.includes("--apply");

async function main() {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloud) throw new Error("CLOUDINARY_CLOUD_NAME is not set (check .env.local).");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set (check .env.local).");

  const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
  try {
    const rows = await sql`
      select id, public_id from product_images
      where public_id is not null and (url is null or url = '')
    `;
    console.log(`Found ${rows.length} product image row(s) with a publicId but no url.`);
    for (const r of rows) {
      const url = `https://res.cloudinary.com/${cloud}/image/upload/${r.public_id}`;
      console.log(`${APPLY ? "Setting" : "[dry-run] would set"} ${r.id} -> ${url}`);
      if (APPLY) await sql`update product_images set url = ${url} where id = ${r.id}`;
    }
    console.log(APPLY ? "\nDone." : "\nDry run only -- re-run with --apply to write these changes.");
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
