import { and, eq } from "drizzle-orm";
import { auth, orgPermisstionStatement, type OrgPermissions } from "@/auth";
import { db } from "@/db";
import {
  member,
  organization,
  organizationRole,
  user,
} from "@/db/schema/auth.schema";

// Dynamic roles stored per organization, on top of the static owner/admin/member roles
const organizationRoles: {
  role: string;
  permission: OrgPermissions;
}[] = [
  {
    role: "owner",
    permission: orgPermisstionStatement as any,
  },
  { role: "parent", permission: {} },
  { role: "staff", permission: {} },
  { role: "supervisor", permission: {} },
  { role: "finance", permission: {} },
];

type Role = "owner" | "admin" | "member" | "parent" | "receptionist";

const users = [
  {
    name: "jimmy",
    email: "jimmykaguru@gmail.com",
    password: "jimmykaguru@gmail.com",
    platformAdmin: true,
  },
];

const organizations: {
  id: string;
  name: string;
  slug: string;
  owner: string;
  members: { email: string; role: Role }[];
}[] = [
  {
    id: "naawa",
    name: "naawa",
    slug: "naawa",
    owner: "jimmykaguru@gmail.com",
    members: [],
  },
];

async function seedUsers() {
  const ids = new Map<string, string>();

  for (const { platformAdmin, ...data } of users) {
    const [existing] = await db
      .select()
      .from(user)
      .where(eq(user.email, data.email));

    if (existing) {
      ids.set(data.email, existing.id);
      continue;
    }

    // Goes through Better Auth so the password is hashed and an account row is created
    const { user: created } = await auth.api.signUpEmail({ body: data });

    // role is not settable on sign up, so promote platform admins directly
    if (platformAdmin) {
      await db
        .update(user)
        .set({ role: "admin" })
        .where(eq(user.id, created.id));
    }

    ids.set(data.email, created.id);
    console.log(`user: ${data.email}`);
  }

  return ids;
}

async function seedOrganizations(userIds: Map<string, string>) {
  for (const org of organizations) {
    await db.transaction(async (tx) => {
      let [existing] = await tx
        .select()
        .from(organization)
        .where(eq(organization.slug, org.slug));

      // Better Auth tables have text ids with no db default, so the org uses a fixed id
      if (!existing) {
        [existing] = await tx
          .insert(organization)
          .values({
            id: org.id,
            name: org.name,
            slug: org.slug,
            createdAt: new Date(),
          })
          .returning();

        console.log(`organization: ${org.slug}`);
      }

      const organizationId = existing!.id;

      for (const r of organizationRoles) {
        const [role] = await tx
          .select({ id: organizationRole.id })
          .from(organizationRole)
          .where(
            and(
              eq(organizationRole.organizationId, organizationId),
              eq(organizationRole.role, r.role),
            ),
          );

        const permission = JSON.stringify(r.permission);

        if (role) {
          await tx
            .update(organizationRole)
            .set({ permission, updatedAt: new Date() })
            .where(eq(organizationRole.id, role.id));

          console.log(`role updated: ${r.role} -> ${org.slug}`);
          continue;
        }

        // Better Auth stores permissions as a JSON string
        await tx.insert(organizationRole).values({
          id: crypto.randomUUID(),
          organizationId,
          role: r.role,
          permission,
        });

        console.log(`role: ${r.role} -> ${org.slug}`);
      }

      for (const m of [
        { email: org.owner, role: "owner" as Role },
        ...org.members,
      ]) {
        const userId = userIds.get(m.email);

        if (!userId) throw new Error(`${m.email} is not in the users list`);

        const [membership] = await tx
          .select({ id: member.id })
          .from(member)
          .where(
            and(
              eq(member.userId, userId),
              eq(member.organizationId, organizationId),
            ),
          );

        if (membership) continue;

        await tx.insert(member).values({
          id: crypto.randomUUID(),
          organizationId,
          userId,
          role: m.role,
          createdAt: new Date(),
        });

        console.log(`member: ${m.email} -> ${org.slug} (${m.role})`);
      }
    });
  }
}

async function main() {
  const userIds = await seedUsers();
  await seedOrganizations(userIds);
  console.log("seed complete");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
