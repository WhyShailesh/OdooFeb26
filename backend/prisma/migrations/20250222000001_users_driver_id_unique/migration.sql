-- CreateIndex: ensure 1:1 User <-> Driver (at most one user per driver)
CREATE UNIQUE INDEX IF NOT EXISTS "users_driverId_key" ON "users"("driverId");
