
export default function Home() {
  return (
    <div className="container mx-auto p-8">
      <section className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] space-y-8">
        <h1 className="text-4xl md:text-6xl font-bold text-center bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Welcome to TalentPath
        </h1>
        <p className="text-xl text-muted-foreground text-center max-w-2xl">
          Your journey to success starts here. Manage your career, connect with
          opportunities, and grow professionally.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 border rounded-lg bg-card hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2">Secure Authentication</h3>
            <p className="text-muted-foreground">
              Google OAuth integration with role-based access control
            </p>
          </div>

          <div className="p-6 border rounded-lg bg-card hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2">Modern Design</h3>
            <p className="text-muted-foreground">
              Beautiful UI with dark/light mode support and shadcn components
            </p>
          </div>

          <div className="p-6 border rounded-lg bg-card hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2">Type-Safe</h3>
            <p className="text-muted-foreground">
              Built with TypeScript, Next.js 15, and Drizzle ORM
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
