import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Users, 
  Map, 
  FileSpreadsheet, 
  Briefcase, 
  GraduationCap,
  Code,
  Trophy,
  Settings,
  BarChart,
  Mail,
  Bell
} from 'lucide-react';

interface UserSession {
  id?: string;
  name?: string;
  email?: string;
  image?: string;
  role?: string;
  emailVerified?: boolean | string | null;
}

export default async function AdminDashboard() {
  const session = await auth();

  // Check if user is logged in
  if (!session?.user) {
    redirect('/');
  }
  // Enforce admin role: only users with role 'admin' may access this page
  const role = (session.user as UserSession)?.role ?? 'user';
  if (String(role).toLowerCase() !== 'admin') {
    // Redirect non-admin users to home (or a 403 page if you prefer)
    redirect('/');
  }

  return (
    <div className="container mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8 text-amber-600" />
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage system settings and users
        </p>
      </div>

      {/* Admin Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Management */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-6 w-6 text-amber-600" />
              <CardTitle>User Management</CardTitle>
            </div>
            <CardDescription>
              View, edit, and manage all user accounts. Change roles and monitor user activity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/viewuser">
              <Button className="w-full cursor-pointer">
                Manage Users
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Roadmap Management */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Map className="h-6 w-6 text-blue-600" />
              <CardTitle>Roadmap Management</CardTitle>
            </div>
            <CardDescription>
              Add, edit, and manage learning roadmaps for different career paths.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/roadmap">
              <Button className="w-full cursor-pointer" variant="outline">
                Manage Roadmaps
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* DSA Questions */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <FileSpreadsheet className="h-6 w-6 text-green-600" />
              <CardTitle>DSA Questions</CardTitle>
            </div>
            <CardDescription>
              Add and manage Data Structures and Algorithms questions for practice.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/dsa-questions">
              <Button className="w-full cursor-pointer" variant="outline">
                Manage Questions
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Jobs Management */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="h-6 w-6 text-purple-600" />
              <CardTitle>Jobs & Opportunities</CardTitle>
            </div>
            <CardDescription>
              Post and manage job listings and career opportunities for users.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/jobs">
              <Button className="w-full cursor-pointer" variant="outline">
                Manage Jobs
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Internships Management */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="h-6 w-6 text-indigo-600" />
              <CardTitle>Internships</CardTitle>
            </div>
            <CardDescription>
              Add and manage internship opportunities for students and learners.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/internships">
              <Button className="w-full cursor-pointer" variant="outline">
                Manage Internships
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Aptitude Questions */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Code className="h-6 w-6 text-red-600" />
              <CardTitle>Aptitude Questions</CardTitle>
            </div>
            <CardDescription>
              Create and manage aptitude test questions for skill assessment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/aptitude-questions">
              <Button className="w-full cursor-pointer" variant="outline">
                Manage Aptitude
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Contest Management */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-6 w-6 text-primary" />
              <CardTitle>Contest Management</CardTitle>
            </div>
            <CardDescription>
              Create, schedule, and manage coding contests and competitions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/contests">
              <Button className="w-full cursor-pointer" variant="outline">
                Manage Contests
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Analytics & Reports */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <BarChart className="h-6 w-6 text-cyan-600" />
              <CardTitle>Analytics & Reports</CardTitle>
            </div>
            <CardDescription>
              View platform statistics, user engagement, and performance metrics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/analytics">
              <Button className="w-full cursor-pointer" variant="outline">
                View Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-6 w-6 text-orange-600" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>
              Send announcements and notifications to users and manage alerts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/notifications">
              <Button className="w-full cursor-pointer" variant="outline">
                Manage Notifications
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Email Campaigns */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-6 w-6 text-pink-600" />
              <CardTitle>Email Campaigns</CardTitle>
            </div>
            <CardDescription>
              Create and send email campaigns to users and manage templates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/email-campaigns">
              <Button className="w-full cursor-pointer" variant="outline">
                Manage Emails
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Settings className="h-6 w-6 text-gray-600" />
              <CardTitle>System Settings</CardTitle>
            </div>
            <CardDescription>
              Configure platform settings, security, and system preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/settings">
              <Button className="w-full cursor-pointer" variant="outline">
                Configure Settings
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Compiler Settings */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Code className="h-6 w-6 text-emerald-600" />
              <CardTitle>Compiler Management</CardTitle>
            </div>
            <CardDescription>
              Manage online compiler settings, languages, and execution limits.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/compiler">
              <Button className="w-full cursor-pointer" variant="outline">
                Manage Compiler
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
