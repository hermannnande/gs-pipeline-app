-- CreateTable
CREATE TABLE "page_views" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL DEFAULT 1,
    "slug" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "templateId" INTEGER,
    "visitorId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "isUnique" BOOLEAN NOT NULL DEFAULT true,
    "isNewSession" BOOLEAN NOT NULL DEFAULT true,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "fbclid" TEXT,
    "gclid" TEXT,
    "userAgent" TEXT,
    "ip" TEXT,
    "country" TEXT,
    "city" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "page_views_companyId_createdAt_idx" ON "page_views"("companyId", "createdAt");
CREATE INDEX "page_views_slug_createdAt_idx" ON "page_views"("slug", "createdAt");
CREATE INDEX "page_views_visitorId_idx" ON "page_views"("visitorId");

-- AddForeignKey
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
