-- better-auth 1.7 scopes account identities by (issuer, account_id).
-- Add issuer nullable, backfill existing rows with the same values 1.7
-- derives for new sign-ins, then enforce NOT NULL and the new unique index.
ALTER TABLE "account" ADD COLUMN "issuer" text;--> statement-breakpoint
UPDATE "account" SET "issuer" = CASE
	WHEN provider_id = 'google' THEN 'https://accounts.google.com'
	WHEN provider_id = 'github' THEN 'local:oauth:github'
	WHEN provider_id = 'credential' THEN 'local:credential'
	ELSE 'local:oauth:' || provider_id
END;--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "issuer" SET NOT NULL;--> statement-breakpoint
DROP INDEX "account_provider_account_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "account_issuer_account_unique" ON "account" USING btree ("issuer","account_id");
