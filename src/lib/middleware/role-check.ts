// import { auth } from '@/lib/auth';
// import { headers } from 'next/headers';
// import { Role } from '@/lib/db/schema';

// export async function checkRole(allowedRoles: Role[]) {
//   const session = await auth.api.getSession({
//     headers: await headers(),
//   });

//   if (!session?.user) {
//     return { authorized: false, user: null };
//   }

//   const userRole = (session.user as any).role || Role.USER;
//   const authorized = allowedRoles.includes(userRole);

//   return { authorized, user: session.user, role: userRole };
// }

// export async function requireRole(allowedRoles: Role[]) {
//   const { authorized, user, role } = await checkRole(allowedRoles);

//   if (!authorized) {
//     throw new Error(`Unauthorized. Required roles: ${allowedRoles.join(', ')}`);
//   }

//   return { user, role };
// }
