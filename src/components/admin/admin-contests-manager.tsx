"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Loader2, 
  Plus, 
  Calendar, 
  Users, 
  Trophy, 
  Settings, 
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { getAllContests, createContest, deleteContest } from "@/actions/contest.actions";
import { format } from "date-fns";
import { toast } from "sonner";

interface Contest {
  id: string;
  title: string;
  description: string;
  slug: string;
  startTime: Date;
  endTime: Date;
  isPublic: boolean;
  maxParticipants: number | null;
  createdBy: string;
  createdAt: Date;
  _count?: {
    questions: number;
    registrations: number;
  };
}

interface ContestStats {
  totalContests: number;
  activeContests: number;
  upcomingContests: number;
  completedContests: number;
  totalParticipants: number;
}

export function AdminContestsManager() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("contests");
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contestToDelete, setContestToDelete] = useState<Contest | null>(null);
  const [creatingContest, setCreatingContest] = useState(false);
  const [deletingContest, setDeletingContest] = useState(false);

  // Stats
  const [stats, setStats] = useState<ContestStats>({
    totalContests: 0,
    activeContests: 0,
    upcomingContests: 0,
    completedContests: 0,
    totalParticipants: 0,
  });

  // Form state
  const [newContest, setNewContest] = useState({
    title: "",
    description: "",
    slug: "",
    startTime: "",
    endTime: "",
    isPublic: true,
    maxParticipants: "",
  });

  useEffect(() => {
    loadContests();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [contests]);

  const loadContests = async () => {
    setLoading(true);
    try {
      const result = await getAllContests();
      if (result.success && result.data) {
        setContests(result.data as Contest[]);
      } else {
        toast.error("Failed to load contests");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load contests");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const now = new Date();
    const active = contests.filter(
      (c) => new Date(c.startTime) <= now && new Date(c.endTime) >= now
    ).length;
    const upcoming = contests.filter((c) => new Date(c.startTime) > now).length;
    const completed = contests.filter((c) => new Date(c.endTime) < now).length;
    const totalParticipants = contests.reduce(
      (sum, c) => sum + (c._count?.registrations || 0),
      0
    );

    setStats({
      totalContests: contests.length,
      activeContests: active,
      upcomingContests: upcoming,
      completedContests: completed,
      totalParticipants,
    });
  };

  const handleCreateContest = async () => {
    if (!newContest.title || !newContest.slug || !newContest.startTime || !newContest.endTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    setCreatingContest(true);
    try {
      const result = await createContest({
        title: newContest.title,
        description: newContest.description,
        slug: newContest.slug,
        startTime: new Date(newContest.startTime),
        endTime: new Date(newContest.endTime),
        isPublic: newContest.isPublic,
        maxParticipants: newContest.maxParticipants ? parseInt(newContest.maxParticipants) : null,
      });

      if (result.success) {
        toast.success("Contest created successfully!");
        setCreateDialogOpen(false);
        setNewContest({
          title: "",
          description: "",
          slug: "",
          startTime: "",
          endTime: "",
          isPublic: true,
          maxParticipants: "",
        });
        loadContests();
      } else {
        toast.error(result.error || "Failed to create contest");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create contest");
    } finally {
      setCreatingContest(false);
    }
  };

  const handleDeleteContest = async () => {
    if (!contestToDelete) return;

    setDeletingContest(true);
    try {
      const result = await deleteContest(contestToDelete.id);
      if (result.success) {
        toast.success("Contest deleted successfully!");
        setDeleteDialogOpen(false);
        setContestToDelete(null);
        loadContests();
      } else {
        toast.error(result.error || "Failed to delete contest");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete contest");
    } finally {
      setDeletingContest(false);
    }
  };

  const getContestStatus = (contest: Contest) => {
    const now = new Date();
    const start = new Date(contest.startTime);
    const end = new Date(contest.endTime);

    if (now < start) return "upcoming";
    if (now > end) return "completed";
    return "active";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case "upcoming":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
            <Calendar className="h-3 w-3 mr-1" />
            Upcoming
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      default:
        return null;
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const filteredContests = contests.filter(
    (contest) =>
      contest.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contest.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contest.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Contests</CardDescription>
            <CardTitle className="text-3xl">{stats.totalContests}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.activeContests}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Upcoming</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.upcomingContests}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl text-gray-600">{stats.completedContests}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Participants</CardDescription>
            <CardTitle className="text-3xl">{stats.totalParticipants}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="contests">All Contests ({stats.totalContests})</TabsTrigger>
          <TabsTrigger value="create">Create New Contest</TabsTrigger>
        </TabsList>

        <TabsContent value="contests" className="space-y-4">
          {/* Search and Create Button */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search contests by title, description, or slug..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Contest
            </Button>
          </div>

          {/* Contests List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredContests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  {searchQuery ? "No contests match your search" : "No contests yet. Create your first contest!"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px] rounded-md border">
              <div className="p-4 space-y-3">
                {filteredContests.map((contest) => {
                  const status = getContestStatus(contest);
                  return (
                    <Card key={contest.id} className="overflow-hidden hover:border-primary/50 transition-colors">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-lg">{contest.title}</CardTitle>
                              {getStatusBadge(status)}
                              {contest.isPublic ? (
                                <Badge variant="outline" className="text-xs">Public</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">Private</Badge>
                              )}
                            </div>
                            <CardDescription className="line-clamp-2">
                              {contest.description || "No description"}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Slug:</span>
                              <div className="font-mono text-xs">{contest.slug}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Questions:</span>
                              <div className="font-medium">{contest._count?.questions || 0}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Participants:</span>
                              <div className="font-medium">{contest._count?.registrations || 0}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Max Participants:</span>
                              <div className="font-medium">{contest.maxParticipants || "Unlimited"}</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Start:</span>
                              <div className="font-medium">
                                {format(new Date(contest.startTime), "MMM dd, yyyy HH:mm")}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">End:</span>
                              <div className="font-medium">
                                {format(new Date(contest.endTime), "MMM dd, yyyy HH:mm")}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/contest/${contest.slug}/manage`)}
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Manage
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/contest/${contest.slug}`)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setContestToDelete(contest);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Contest</CardTitle>
              <CardDescription>
                Fill in the details below to create a new coding contest.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Contest Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Spring Coding Challenge 2024"
                  value={newContest.title}
                  onChange={(e) => {
                    setNewContest({ ...newContest, title: e.target.value });
                    if (!newContest.slug) {
                      setNewContest({
                        ...newContest,
                        title: e.target.value,
                        slug: generateSlug(e.target.value),
                      });
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Contest Slug (URL) *</Label>
                <Input
                  id="slug"
                  placeholder="e.g., spring-challenge-2024"
                  value={newContest.slug}
                  onChange={(e) => setNewContest({ ...newContest, slug: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  This will be used in the URL: /contest/{newContest.slug || "your-slug"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your contest..."
                  value={newContest.description}
                  onChange={(e) => setNewContest({ ...newContest, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={newContest.startTime}
                    onChange={(e) => setNewContest({ ...newContest, startTime: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={newContest.endTime}
                    onChange={(e) => setNewContest({ ...newContest, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxParticipants">Max Participants (optional)</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  placeholder="Leave empty for unlimited"
                  value={newContest.maxParticipants}
                  onChange={(e) => setNewContest({ ...newContest, maxParticipants: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={newContest.isPublic}
                  onChange={(e) => setNewContest({ ...newContest, isPublic: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="isPublic">Make this contest public</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setNewContest({
                      title: "",
                      description: "",
                      slug: "",
                      startTime: "",
                      endTime: "",
                      isPublic: true,
                      maxParticipants: "",
                    });
                  }}
                >
                  Reset
                </Button>
                <Button onClick={handleCreateContest} disabled={creatingContest}>
                  {creatingContest ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Create Contest
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Contest Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Contest</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new coding contest.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dialog-title">Contest Title *</Label>
              <Input
                id="dialog-title"
                placeholder="e.g., Spring Coding Challenge 2024"
                value={newContest.title}
                onChange={(e) => {
                  setNewContest({ ...newContest, title: e.target.value });
                  if (!newContest.slug) {
                    setNewContest({
                      ...newContest,
                      title: e.target.value,
                      slug: generateSlug(e.target.value),
                    });
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dialog-slug">Contest Slug (URL) *</Label>
              <Input
                id="dialog-slug"
                placeholder="e.g., spring-challenge-2024"
                value={newContest.slug}
                onChange={(e) => setNewContest({ ...newContest, slug: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dialog-description">Description</Label>
              <Textarea
                id="dialog-description"
                placeholder="Describe your contest..."
                value={newContest.description}
                onChange={(e) => setNewContest({ ...newContest, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dialog-startTime">Start Time *</Label>
                <Input
                  id="dialog-startTime"
                  type="datetime-local"
                  value={newContest.startTime}
                  onChange={(e) => setNewContest({ ...newContest, startTime: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dialog-endTime">End Time *</Label>
                <Input
                  id="dialog-endTime"
                  type="datetime-local"
                  value={newContest.endTime}
                  onChange={(e) => setNewContest({ ...newContest, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dialog-maxParticipants">Max Participants</Label>
              <Input
                id="dialog-maxParticipants"
                type="number"
                placeholder="Leave empty for unlimited"
                value={newContest.maxParticipants}
                onChange={(e) => setNewContest({ ...newContest, maxParticipants: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="dialog-isPublic"
                checked={newContest.isPublic}
                onChange={(e) => setNewContest({ ...newContest, isPublic: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="dialog-isPublic">Make this contest public</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateContest} disabled={creatingContest}>
              {creatingContest ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Create Contest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contest</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{contestToDelete?.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteContest}
              disabled={deletingContest}
            >
              {deletingContest ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
