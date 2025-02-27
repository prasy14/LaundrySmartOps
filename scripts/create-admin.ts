import { hashPassword } from "../server/utils/auth";
import { storage } from "../server/storage";

async function createAdmin() {
  const hashedPassword = await hashPassword("admin123");

  await storage.createUser({
    username: "admin",
    password: hashedPassword,
    role: "admin",
    name: "Admin User",
    email: "admin@example.com"
  });

  console.log("Admin user created successfully");
}

createAdmin().catch(console.error);