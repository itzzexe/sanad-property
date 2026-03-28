-- AlterEnum
ALTER TYPE "Currency" ADD VALUE 'IQD';

-- AlterTable
ALTER TABLE "installments" ALTER COLUMN "currency" SET DEFAULT 'IQD';

-- AlterTable
ALTER TABLE "leases" ALTER COLUMN "currency" SET DEFAULT 'IQD';

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "currency" SET DEFAULT 'IQD';

-- AlterTable
ALTER TABLE "units" ALTER COLUMN "currency" SET DEFAULT 'IQD';

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "organization_name" TEXT NOT NULL DEFAULT 'RentFlow',
    "default_currency" "Currency" NOT NULL DEFAULT 'IQD',
    "exchange_rate_usd" DOUBLE PRECISION NOT NULL DEFAULT 1460.0,
    "language" TEXT NOT NULL DEFAULT 'ar',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);
