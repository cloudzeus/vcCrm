import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type UserRole = "SUPERADMIN" | "OWNER" | "MANAGER" | "INFLUENCER" | "CLIENT";

export async function getCurrentUserOrThrow(): Promise<{
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
  organizationId: string | null;
}> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  const user = session.user as any;
  if (!user.id || !user.role) {
    throw new Error("Invalid user session");
  }
  return {
    id: user.id,
    email: user.email || "",
    name: user.name,
    role: user.role as UserRole,
    organizationId: user.organizationId || null,
  };
}

export async function getOrganizationOrThrow(organizationId?: string): Promise<NonNullable<Awaited<ReturnType<typeof prisma.organization.findUnique>>>> {
  const user = await getCurrentUserOrThrow();
  
  // SUPERADMIN can access any organization
  if (user.role === "SUPERADMIN") {
    if (organizationId) {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
      });
      if (!org) throw new Error("Organization not found");
      return org;
    }
    // If no orgId provided, use user's org if they have one
    if (user.organizationId) {
      const org = await prisma.organization.findUnique({
        where: { id: user.organizationId },
      });
      if (!org) throw new Error("Organization not found");
      return org;
    }
    // If SUPERADMIN has no orgId, get the first organization (for demo purposes)
    const firstOrg = await prisma.organization.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (!firstOrg) {
      throw new Error("No organizations found. Please create an organization first.");
    }
    return firstOrg;
  }

  // Other roles must use their own organization
  if (!user.organizationId) {
    throw new Error("User not assigned to an organization");
  }

  // If organizationId is provided, verify it matches user's org
  if (organizationId && organizationId !== user.organizationId) {
    throw new Error("Access denied to this organization");
  }

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
  });

  if (!org) {
    throw new Error("Organization not found");
  }

  return org;
}

export function hasRole(user: { role: UserRole }, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(user.role);
}

export function requireRole(user: { role: UserRole }, allowedRoles: UserRole[]) {
  if (!hasRole(user, allowedRoles)) {
    throw new Error("Insufficient permissions");
  }
}

