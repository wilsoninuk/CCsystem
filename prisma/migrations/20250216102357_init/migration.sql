/*
  Warnings:

  - You are about to drop the column `paymentTerms` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `shipperInfo` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `CustomerProductPrice` table. All the data in the column will be lost.
  - The primary key for the `Product` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `date` on the `Quotation` table. All the data in the column will be lost.
  - You are about to drop the column `priceRMB` on the `QuotationItem` table. All the data in the column will be lost.
  - You are about to drop the column `priceUSD` on the `QuotationItem` table. All the data in the column will be lost.
  - You are about to drop the `OrderAnalysis` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[code]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[number]` on the table `Quotation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentMethod` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `piShipper` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Made the column `piAddress` on table `Customer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `shippingMethod` on table `Customer` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `priceUSD` to the `CustomerProductPrice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `number` to the `Quotation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Quotation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `exwPriceRMB` to the `QuotationItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `exwPriceUSD` to the `QuotationItem` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "OrderAnalysis" DROP CONSTRAINT "OrderAnalysis_quotationId_fkey";

-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "paymentTerms",
DROP COLUMN "shipperInfo",
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "exchangeRate" DOUBLE PRECISION,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "paymentMethod" TEXT NOT NULL,
ADD COLUMN     "piShipper" TEXT NOT NULL,
ADD COLUMN     "remark" TEXT,
ALTER COLUMN "piAddress" SET NOT NULL,
ALTER COLUMN "shippingMethod" SET NOT NULL;

-- AlterTable
ALTER TABLE "CustomerProductPrice" DROP COLUMN "currency",
ADD COLUMN     "priceUSD" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "Product" DROP CONSTRAINT "Product_pkey",
ADD COLUMN     "cartonSize" TEXT,
ADD COLUMN     "cartonWeight" DOUBLE PRECISION,
ADD COLUMN     "color" TEXT,
ADD COLUMN     "displayFields" JSONB,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "link1688" TEXT,
ADD COLUMN     "material" TEXT,
ADD COLUMN     "moq" INTEGER,
ADD COLUMN     "picture" TEXT,
ADD COLUMN     "productSize" TEXT,
ADD COLUMN     "remark" TEXT,
ADD COLUMN     "supplier" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Product_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Product_id_seq";

-- AlterTable
ALTER TABLE "Quotation" DROP COLUMN "date",
ADD COLUMN     "number" TEXT NOT NULL,
ADD COLUMN     "remark" TEXT,
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "totalAmountRMB" SET DEFAULT 0,
ALTER COLUMN "totalAmountUSD" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "QuotationItem" DROP COLUMN "priceRMB",
DROP COLUMN "priceUSD",
ADD COLUMN     "actualQty" INTEGER,
ADD COLUMN     "exwPriceRMB" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "exwPriceUSD" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "finalPriceRMB" DOUBLE PRECISION,
ADD COLUMN     "finalPriceUSD" DOUBLE PRECISION,
ADD COLUMN     "profit" DOUBLE PRECISION,
ADD COLUMN     "profitRate" DOUBLE PRECISION,
ADD COLUMN     "remark" TEXT,
ADD COLUMN     "shipping" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "name" SET NOT NULL;

-- DropTable
DROP TABLE "OrderAnalysis";

-- CreateTable
CREATE TABLE "QuotationRevision" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "changes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotationRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_code_key" ON "Customer"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_number_key" ON "Quotation"("number");

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationRevision" ADD CONSTRAINT "QuotationRevision_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
