-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "barcode" TEXT NOT NULL,
    "itemNo" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "piAddress" TEXT,
    "shipperInfo" JSONB,
    "paymentTerms" TEXT,
    "shippingMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerProductPrice" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "priceHistory" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerProductPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "exchangeRate" DOUBLE PRECISION NOT NULL,
    "totalAmountRMB" DOUBLE PRECISION NOT NULL,
    "totalAmountUSD" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationItem" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "serialNo" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "priceRMB" DOUBLE PRECISION NOT NULL,
    "priceUSD" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuotationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderAnalysis" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "actualQuantity" INTEGER NOT NULL,
    "finalPriceRMB" DOUBLE PRECISION NOT NULL,
    "finalPriceUSD" DOUBLE PRECISION NOT NULL,
    "shippingCost" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Product_barcode_key" ON "Product"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "Product_itemNo_key" ON "Product"("itemNo");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProductPrice_customerId_barcode_key" ON "CustomerProductPrice"("customerId", "barcode");

-- CreateIndex
CREATE UNIQUE INDEX "OrderAnalysis_quotationId_key" ON "OrderAnalysis"("quotationId");

-- AddForeignKey
ALTER TABLE "CustomerProductPrice" ADD CONSTRAINT "CustomerProductPrice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerProductPrice" ADD CONSTRAINT "CustomerProductPrice_barcode_fkey" FOREIGN KEY ("barcode") REFERENCES "Product"("barcode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_barcode_fkey" FOREIGN KEY ("barcode") REFERENCES "Product"("barcode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderAnalysis" ADD CONSTRAINT "OrderAnalysis_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
