import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow, getOrganizationOrThrow } from "@/lib/auth-helpers";
import { UserDetailClient } from "@/components/users/user-detail-client";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await getCurrentUserOrThrow();
  const organization = await getOrganizationOrThrow();
  const { id } = await params;

  const [selectedUser, allUsers] = await Promise.all([
    prisma.user.findFirst({
      where: {
        id,
        OR: [
          { organizationId: organization.id },
          { role: "SUPERADMIN" }, // Include SUPERADMIN users even without organizationId
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.findMany({
      where: {
        OR: [
          { organizationId: organization.id },
          { role: "SUPERADMIN" }, // Include SUPERADMIN users even without organizationId
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  if (!selectedUser) {
    notFound();
  }

  return (
    <UserDetailClient
      user={{
        id: selectedUser.id,
        name: selectedUser.name,
        email: selectedUser.email,
        role: selectedUser.role,
        image: selectedUser.image,
        organizationId: selectedUser.organizationId,
        emailVerified: selectedUser.emailVerified?.toISOString() || null,
        createdAt: selectedUser.createdAt.toISOString(),
        updatedAt: selectedUser.updatedAt.toISOString(),
      }}
      allUsers={allUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        image: u.image,
      }))}
    />
  );
}

