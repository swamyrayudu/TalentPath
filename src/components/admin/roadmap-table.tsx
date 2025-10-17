'use client';

import { useState } from 'react';
import Link from 'next/link';
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
import { MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import { deleteRoadmap } from '@/actions/roadmap';
import { toast } from 'sonner';
import type { Roadmap } from '@/lib/db/schema';

export function RoadmapTable({ roadmaps }: { roadmaps: Roadmap[] }) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roadmapToDelete, setRoadmapToDelete] = useState<string | null>(null);

  const handleDeleteRoadmap = async () => {
    if (!roadmapToDelete) return;

    setIsLoading(roadmapToDelete);
    try {
      await deleteRoadmap(roadmapToDelete);
      toast.success('Roadmap deleted successfully');
      setDeleteDialogOpen(false);
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete roadmap');
    } finally {
      setIsLoading(null);
      setRoadmapToDelete(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roadmaps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No roadmaps found. Create your first roadmap.
                </TableCell>
              </TableRow>
            ) : (
              roadmaps.map((roadmap) => (
                <TableRow key={roadmap.id}>
                  <TableCell className="font-medium">{roadmap.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {roadmap.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {roadmap.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {roadmap.isActive ? (
                      <Badge className="bg-green-600">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(roadmap.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          disabled={isLoading === roadmap.id}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/roadmap/${roadmap.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Public
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/roadmap/${roadmap.id}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Steps
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setRoadmapToDelete(roadmap.id);
                            setDeleteDialogOpen(true);
                          }}
                          disabled={isLoading === roadmap.id}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
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
              This will permanently delete this roadmap and all its steps. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRoadmap}
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
