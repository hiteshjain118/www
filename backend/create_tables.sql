-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."profiles" (
    "id" BIGINT NOT NULL DEFAULT nextval('global_cb_profile_bigint_id'),
    "time_zone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'authenticated',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."qbo_profiles" (
    "cb_id" BIGINT NOT NULL DEFAULT nextval('global_non_user_seq'),
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
CREATE TABLE "public"."qbo_profiles_sandbox" (
    "cb_id" BIGINT NOT NULL DEFAULT nextval('global_non_user_seq'),
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

-- CreateTable
CREATE TABLE "public"."threads" (
    "cb_id" BIGINT NOT NULL DEFAULT nextval('global_non_user_seq'),
    "owner_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "threads_pkey" PRIMARY KEY ("cb_id")
);

-- CreateTable
CREATE TABLE "public"."table_attachments" (
    "cb_id" BIGINT NOT NULL DEFAULT nextval('global_non_user_seq'),
    "message_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "columns" JSONB NOT NULL,
    "rows" JSONB NOT NULL,

    CONSTRAINT "table_attachments_pkey" PRIMARY KEY ("cb_id")
);

-- CreateTable
CREATE TABLE "public"."messages" (
    "cb_id" BIGINT NOT NULL DEFAULT nextval('global_non_user_seq'),
    "thread_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sender_id" BIGINT NOT NULL,
    "receiver_id" BIGINT NOT NULL,
    "body" TEXT NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("cb_id")
);

-- CreateTable
CREATE TABLE "public"."pipelines" (
    "cb_id" BIGINT NOT NULL DEFAULT nextval('global_non_user_seq'),
    "owner_id" BIGINT NOT NULL,
    "parent_thread_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pipelines_pkey" PRIMARY KEY ("cb_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "public"."profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- AddForeignKey
ALTER TABLE "public"."qbo_profiles" ADD CONSTRAINT "qbo_profiles_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."qbo_profiles_sandbox" ADD CONSTRAINT "qbo_profiles_sandbox_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."threads" ADD CONSTRAINT "threads_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."table_attachments" ADD CONSTRAINT "table_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("cb_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("cb_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pipelines" ADD CONSTRAINT "pipelines_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pipelines" ADD CONSTRAINT "pipelines_parent_thread_id_fkey" FOREIGN KEY ("parent_thread_id") REFERENCES "public"."threads"("cb_id") ON DELETE SET NULL ON UPDATE CASCADE;

