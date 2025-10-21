import { AdminContestsManager } from "@/components/admin/contests/AdminContestsManager";

export default function AdminContestsPage() {
  return (
    <div className="container mx-auto py-8" suppressHydrationWarning key="admin-contests-page">
      <div className="mb-8" key="admin-contests-header">
        <h1 className="text-3xl font-bold">Contest Management</h1>
        <p className="text-muted-foreground mt-2">
          Create and manage coding contests. Add questions from your library and configure contest settings.
        </p>
      </div>
      <AdminContestsManager key="admin-contests-manager" />
    </div>
  );
}
