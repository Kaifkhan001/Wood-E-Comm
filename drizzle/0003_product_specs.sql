ALTER TABLE "products" ADD COLUMN "brand" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sku" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "width_cm" numeric(7, 1);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "depth_cm" numeric(7, 1);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "height_cm" numeric(7, 1);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "weight_kg" numeric(7, 1);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "assembly" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "warranty_months" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "country_of_origin" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "highlights" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "specs" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "products_sku_idx" ON "products" USING btree ("sku");