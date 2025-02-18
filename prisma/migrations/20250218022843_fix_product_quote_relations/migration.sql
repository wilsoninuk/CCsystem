/*
  Warnings:

  - You are about to drop the column `barcode` on the `CustomerProductPrice` table. All the data in the column will be lost.
  - You are about to drop the column `priceHistory` on the `CustomerProductPrice` table. All the data in the column will be lost.
  - You are about to drop the column `priceUSD` on the `CustomerProductPrice` table. All the data in the column will be lost.
  - You are about to drop the column `displayFields` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `remark` on the `Product` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[customerId,productId]` on the table `CustomerProductPrice` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `productId` to the `CustomerProductPrice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerName` to the `Quotation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentMethod` to the `Quotation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `piAddress` to the `Quotation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `piShipper` to the `Quotation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shippingMethod` to the `Quotation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productId` to the `QuotationItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CustomerProductPrice" DROP CONSTRAINT "CustomerProductPrice_barcode_fkey";

-- DropForeignKey
ALTER TABLE "QuotationItem" DROP CONSTRAINT "QuotationItem_barcode_fkey";

-- DropIndex
DROP INDEX "CustomerProductPrice_customerId_barcode_key";

-- AlterTable
ALTER TABLE "CustomerProductPrice" DROP COLUMN "barcode",
DROP COLUMN "priceHistory",
DROP COLUMN "priceUSD",
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "productId" TEXT NOT NULL,
ADD COLUMN     "remark" TEXT;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "displayFields",
DROP COLUMN "remark";

-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "customerName" TEXT NOT NULL,
ADD COLUMN     "paymentMethod" TEXT NOT NULL,
ADD COLUMN     "piAddress" TEXT NOT NULL,
ADD COLUMN     "piShipper" TEXT NOT NULL,
ADD COLUMN     "shippingMethod" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "QuotationItem" ADD COLUMN     "productId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ProductQuote" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'active',
    "validUntil" TIMESTAMP(3),
    "remark" TEXT,

    CONSTRAINT "ProductQuote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductQuote_productId_idx" ON "ProductQuote"("productId");

-- CreateIndex
CREATE INDEX "ProductQuote_customerId_idx" ON "ProductQuote"("customerId");

-- CreateIndex
CREATE INDEX "CustomerProductPrice_customerId_idx" ON "CustomerProductPrice"("customerId");

-- CreateIndex
CREATE INDEX "CustomerProductPrice_productId_idx" ON "CustomerProductPrice"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProductPrice_customerId_productId_key" ON "CustomerProductPrice"("customerId", "productId");

-- CreateIndex
CREATE INDEX "Quotation_number_idx" ON "Quotation"("number");

-- AddForeignKey
ALTER TABLE "CustomerProductPrice" ADD CONSTRAINT "CustomerProductPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductQuote" ADD CONSTRAINT "ProductQuote_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductQuote" ADD CONSTRAINT "ProductQuote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
