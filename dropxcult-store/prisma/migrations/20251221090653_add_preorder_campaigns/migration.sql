-- CreateTable
CREATE TABLE "PreOrderCampaign" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "minQuantity" INTEGER NOT NULL DEFAULT 50,
    "maxQuantity" INTEGER,
    "deliveryDays" INTEGER NOT NULL DEFAULT 25,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "totalQuantity" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreOrderCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreOrderEntry" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paymentId" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "paidAt" TIMESTAMP(3),
    "refundId" TEXT,
    "refundedAt" TIMESTAMP(3),
    "refundReason" TEXT,
    "shippingAddress" JSONB NOT NULL,
    "trackingNumber" TEXT,
    "courier" TEXT,
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "statusHistory" JSONB NOT NULL DEFAULT '[]',
    "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
    "notifyWhatsapp" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreOrderEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreOrderEntryItem" (
    "id" TEXT NOT NULL,
    "preOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PreOrderEntryItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PreOrderEntry_orderNumber_key" ON "PreOrderEntry"("orderNumber");

-- AddForeignKey
ALTER TABLE "PreOrderCampaign" ADD CONSTRAINT "PreOrderCampaign_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreOrderEntry" ADD CONSTRAINT "PreOrderEntry_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "PreOrderCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreOrderEntry" ADD CONSTRAINT "PreOrderEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreOrderEntryItem" ADD CONSTRAINT "PreOrderEntryItem_preOrderId_fkey" FOREIGN KEY ("preOrderId") REFERENCES "PreOrderEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreOrderEntryItem" ADD CONSTRAINT "PreOrderEntryItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
