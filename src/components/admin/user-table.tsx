'use client';

import React from 'react';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, Shield, User, Trash2, CheckCircle2, Clock, Activity, LogOut } from 'lucide-react';
import { updateUserRole, deleteUser } from '@/actions/user';
import { toast } from 'sonner';

type UserType = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: 'user' | 'admin';
  emailVerified: Date | null;
  createdAt: Date | null;
  lastLoginAt: Date | null;
  lastActiveAt: Date | null;
  lastLogoutAt: Date | null;
};

export function UserTable({ users, currentUserId }: { users: UserType[]; currentUserId: string }) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    setIsLoading(userId);
    try {
      await updateUserRole(userId, newRole);
      toast.success(`User role updated to ${newRole}`, {
        description: 'The changes will be reflected immediately.',
      });
      // Reload the page to reflect changes
      window.location.reload();
    } catch (error: unknown) {
      let message = 'Something went wrong';
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error('Failed to update user role', {
        description: message,
      });
    } finally {
      setIsLoading(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsLoading(userToDelete);
    try {
      await deleteUser(userToDelete);
      toast.success('User deleted successfully', {
        description: 'The user has been removed.',
      });
    } catch (error: unknown) {
      let message = 'Something went wrong';
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error('Failed to delete user', {
        description: message,
      });
    } finally {
      setIsLoading(null);
      setUserToDelete(null);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatLastLogin = (date: Date | null) => {
    if (!date) return 'Never';
    
    const loginDate = new Date(date);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const loginDay = new Date(loginDate.getFullYear(), loginDate.getMonth(), loginDate.getDate());
    
    const timeStr = loginDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    
    if (loginDay.getTime() === today.getTime()) {
      return `Today at ${timeStr}`;
    } else if (loginDay.getTime() === yesterday.getTime()) {
      return `Yesterday at ${timeStr}`;
    } else {
      const diffDays = Math.floor((today.getTime() - loginDay.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else {
        return loginDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      }
    }
  };

  const formatLastActive = (date: Date | null) => {
    if (!date) return 'Never';
    
    const activeDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - activeDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // If active within last 5 minutes, show as "Online"
    if (diffMinutes < 5) {
      return 'Online';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} min ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hr ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return activeDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
  };

  const isOnline = (date: Date | null) => {
    if (!date) return false;
    const activeDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - activeDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return diffMinutes < 5;
  };

  const formatLastLogout = (date: Date | null) => {
    if (!date) return 'Never';
    
    const logoutDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - logoutDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} min ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hr ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return logoutDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead>Last Left</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.image || ''} alt={user.name || 'User'} />
                        <AvatarFallback className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name || 'Unknown'}</p>
                        {user.id === currentUserId && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role === 'admin' ? (
                        <>
                          <Shield className="mr-1 h-3 w-3" />
                          Admin
                        </>
                      ) : (
                        <>
                          <User className="mr-1 h-3 w-3" />
                          User
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.emailVerified ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <span className="text-muted-foreground text-sm">Not verified</span>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">{formatLastLogin(user.lastLoginAt)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {isOnline(user.lastActiveAt) ? (
                        <>
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                          </span>
                          <span className="text-sm text-green-600 font-medium">Online</span>
                        </>
                      ) : (
                        <>
                          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{formatLastActive(user.lastActiveAt)}</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">{formatLastLogout(user.lastLogoutAt)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          disabled={isLoading === user.id}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {user.role === 'user' ? (
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(user.id, 'admin')}
                            disabled={isLoading === user.id}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Promote to Admin
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(user.id, 'user')}
                            disabled={isLoading === user.id || user.id === currentUserId}
                          >
                            <User className="mr-2 h-4 w-4" />
                            Demote to User
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setUserToDelete(user.id);
                            setDeleteDialogOpen(true);
                          }}
                          disabled={user.id === currentUserId || isLoading === user.id}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account and
              remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
