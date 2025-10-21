import { AdminContestsManager } from "@/components/admin/admin-contests-manager";

export default function AdminContestsPage() {
  return (
    <div className="container mx-auto py-8" suppressHydrationWarning>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Contest Management</h1>
        <p className="text-muted-foreground mt-2">
          Create and manage coding contests. Add questions from your library and configure contest settings.
        </p>
      </div>
      <AdminContestsManager />
    </div>
  );
}
