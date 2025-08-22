-- CreateTable
CREATE TABLE "qbo_profiles" (
    "cb_id" BIGINT NOT NULL,
    "owner_id" BIGINT NOT NULL,
    "realm_id" TEXT,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "expires_in" INTEGER,
    "refresh_token_expires_in" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qbo_profiles_pkey" PRIMARY KEY ("cb_id")
);

-- CreateTable
CREATE TABLE "qbo_profiles_sandbox" (
    "cb_id" BIGINT NOT NULL,
    "owner_id" BIGINT NOT NULL,
    "realm_id" TEXT,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "expires_in" INTEGER,
    "refresh_token_expires_in" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qbo_profiles_sandbox_pkey" PRIMARY KEY ("cb_id")
);

-- AddForeignKey
ALTER TABLE "qbo_profiles" ADD CONSTRAINT "qbo_profiles_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qbo_profiles_sandbox" ADD CONSTRAINT "qbo_profiles_sandbox_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE; 