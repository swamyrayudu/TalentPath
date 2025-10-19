import { AdminQuestionsManager } from "@/components/admin/admin-questions-manager";

export default function AdminQuestionsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Question Library Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage your master question library and test cases. Import from CSV or create manually.
        </p>
      </div>
      <AdminQuestionsManager />
    </div>
  );
}
