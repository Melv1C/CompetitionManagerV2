import { UserRole$ } from "@repo/utils";
import "varlock/auto-load";

import { auth } from "@/lib/auth";
import { prismaWithoutLog } from "@/lib/prisma";

interface AdminParams {
  name: string;
  email: string;
  password: string;
}

function parseArgs(): AdminParams {
  const args = process.argv.slice(2);

  if (args.length !== 3) {
    console.error("Usage: bun add-admin -- <name> <email> <password>");
    console.error('Example: bun add-admin -- "Admin User" admin@example.com mypassword123');
    process.exit(1);
  }

  const [name, email, password] = args;

  if (!name || !email || !password) {
    console.error("All arguments (name, email, password) are required");
    process.exit(1);
  }

  return { name, email, password };
}

async function addAdmin({ name, email, password }: AdminParams): Promise<void> {
  console.log("🔐 Adding admin user...");

  const existingAdmin = await prismaWithoutLog.user.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    console.log(`  ✓ Admin already exists: ${existingAdmin.email}`);
    return;
  }

  try {
    const result = await auth.api.signUpEmail({
      body: { name, email, password },
    });

    if (!result.user) {
      throw new Error("Sign up succeeded but user object was not returned");
    }

    await prismaWithoutLog.user.update({
      where: { id: result.user.id },
      data: {
        role: UserRole$.enum.admin,
        emailVerified: true,
      },
    });

    console.log(`  ✓ Created admin: ${email}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to create admin user ${email}: ${errorMessage}`);
  }
}

const params = parseArgs();
addAdmin(params)
  .then(() => {
    console.log("✅ Admin user added successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Failed to add admin:", error.message);
    process.exit(1);
  })
  .finally(() => {
    prismaWithoutLog.$disconnect();
  });
