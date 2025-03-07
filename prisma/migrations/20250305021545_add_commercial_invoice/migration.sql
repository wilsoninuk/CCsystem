-- CreateTable
CREATE TABLE "CommercialInvoice" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "shippingDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "remark" TEXT,

    CONSTRAINT "CommercialInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialInvoiceItem" (
    "id" TEXT NOT NULL,
    "ciId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "priceRMB" DOUBLE PRECISION NOT NULL,
    "priceUSD" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialInvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommercialInvoice_number_key" ON "CommercialInvoice"("number");

-- CreateIndex
CREATE INDEX "CommercialInvoice_customerId_idx" ON "CommercialInvoice"("customerId");

-- CreateIndex
CREATE INDEX "CommercialInvoice_status_idx" ON "CommercialInvoice"("status");

-- CreateIndex
CREATE INDEX "CommercialInvoice_shippingDate_idx" ON "CommercialInvoice"("shippingDate");

-- CreateIndex
CREATE INDEX "CommercialInvoiceItem_ciId_idx" ON "CommercialInvoiceItem"("ciId");

-- CreateIndex
CREATE INDEX "CommercialInvoiceItem_productId_idx" ON "CommercialInvoiceItem"("productId");

-- AddForeignKey
ALTER TABLE "CommercialInvoice" ADD CONSTRAINT "CommercialInvoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialInvoiceItem" ADD CONSTRAINT "CommercialInvoiceItem_ciId_fkey" FOREIGN KEY ("ciId") REFERENCES "CommercialInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialInvoiceItem" ADD CONSTRAINT "CommercialInvoiceItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
