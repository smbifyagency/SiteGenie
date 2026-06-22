import "dotenv/config";
import { db } from "../server/db.ts";
import { users } from "../shared/schema.ts";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function run() {
    console.log("Seeding users...");

    // 1. Core Admin User
    const adminEmail = "admin@sitegenie.app";
    const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail));

    const adminPassword = process.argv[2] || "AdminPass123!";
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

    if (existingAdmin.length === 0) {
        await db.insert(users).values({
            email: adminEmail,
            password: hashedAdminPassword,
            firstName: "Super",
            lastName: "Admin",
            role: "ai_user", // This is considered admin in auth.ts
            isActive: true,
            websiteLimit: 9999
        });
        console.log(`✅ Created Core Admin user: ${adminEmail} (password: ${adminPassword})`);
    } else {
        await db.update(users).set({ password: hashedAdminPassword, role: "ai_user", isActive: true }).where(eq(users.email, adminEmail));
        console.log(`✅ Updated Core Admin user: ${adminEmail} (password: ${adminPassword})`);
    }

    // 2. Normal User
    const normalEmail = "user@sitegenie.app";
    const existingNormal = await db.select().from(users).where(eq(users.email, normalEmail));

    const normalPassword = process.argv[3] || "UserPass123!";
    const hashedNormalPassword = await bcrypt.hash(normalPassword, 10);

    if (existingNormal.length === 0) {
        await db.insert(users).values({
            email: normalEmail,
            password: hashedNormalPassword,
            firstName: "Test",
            lastName: "User",
            role: "manual_user",
            isActive: true,
            websiteLimit: 1
        });
        console.log(`✅ Created Normal Test user: ${normalEmail} (password: ${normalPassword})`);
    } else {
        await db.update(users).set({ password: hashedNormalPassword, role: "manual_user", isActive: true }).where(eq(users.email, normalEmail));
        console.log(`✅ Updated Normal Test user: ${normalEmail} (password: ${normalPassword})`);
    }

    console.log("Seeding complete!");
    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
