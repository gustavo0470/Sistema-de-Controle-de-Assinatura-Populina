-- CreateTable
CREATE TABLE "public"."signature_attachments" (
    "id" TEXT NOT NULL,
    "signatureId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signature_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_attachment_signature" ON "public"."signature_attachments"("signatureId");

-- CreateIndex
CREATE INDEX "idx_chat_to" ON "public"."chat_messages"("toUserId", "isRead");

-- CreateIndex
CREATE INDEX "idx_req_status" ON "public"."requests"("status");

-- AddForeignKey
ALTER TABLE "public"."signature_attachments" ADD CONSTRAINT "signature_attachments_signatureId_fkey" FOREIGN KEY ("signatureId") REFERENCES "public"."signatures"("id") ON DELETE CASCADE ON UPDATE CASCADE;
