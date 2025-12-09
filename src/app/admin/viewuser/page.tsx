
import React from 'react';

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getAllUsers } from '@/actions/user';
import { UserTable } from '@/components/admin/user-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, UserCheck, UserX, Activity } from 'lucide-react';

interface UserSession {
  id?: string;
  name?: string;
  email?: string;
  image?: string;
  role?: string;
  emailVerified?: boolean | string | null;
}

export default async function Viewusers() {
  const session = await auth();

  // Check if user is logged in
  if (!session?.user) {
    redirect('/');
  }
  const role = (session.user as UserSession)?.role ?? 'user';
  if (String(role).toLowerCase() !== 'admin') {
    // Redirect non-admin users to home (or a 403 page if you prefer)
    redirect('/');
  }

  // Admin role check removed — allow any logged-in user to view this page.

  // Fetch all users
  const users = await getAllUsers();

  // Calculate statistics
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const regularUserCount = users.filter((u) => u.role === 'user').length;
  const verifiedCount = users.filter((u) => u.emailVerified).length;
  
  // Calculate online users (active within last 5 minutes)
  const now = new Date();
  const onlineUsers = users.filter((u) => {
    if (!u.lastActiveAt) return false;
    const lastActive = new Date(u.lastActiveAt);
    const diffMs = now.getTime() - lastActive.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return diffMinutes < 5;
  }).length;

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8 text-amber-600" />
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage users and their roles
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">All registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Now</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{onlineUsers}</div>
            <p className="text-xs text-muted-foreground">Active in last 5 min</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminCount}</div>
            <p className="text-xs text-muted-foreground">Users with admin role</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{regularUserCount}</div>
            <p className="text-xs text-muted-foreground">Standard user accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verifiedCount}</div>
            <p className="text-xs text-muted-foreground">Email verified users</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            View and manage all registered users. Click the actions menu to change user roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserTable users={users} currentUserId={session.user.id as string} />
        </CardContent>
      </Card>
    </div>
  );
}
