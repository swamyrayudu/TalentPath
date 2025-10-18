import { getContests } from '@/actions/contest.actions';
import { ContestCard } from '@/components/contest/contest-card';
import { CreateContestDialog } from '@/components/contest/create-contest-dialog';
import { Button } from '@/components/ui/button';
import { Plus, Trophy } from 'lucide-react';
import { auth } from '@/lib/auth';

export default async function ContestsPage() {
  const session = await auth();
  const contestsResult = await getContests();
  const contests = contestsResult.success && contestsResult.data ? contestsResult.data : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Trophy className="h-8 w-8 text-yellow-500" />
          <div>
            <h1 className="text-3xl font-bold">Coding Contests</h1>
            <p className="text-muted-foreground">Compete, learn, and improve your skills</p>
          </div>
        </div>

        {session?.user && (
          <CreateContestDialog>
            <Button size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Create Contest
            </Button>
          </CreateContestDialog>
        )}
      </div>

      {contests.length === 0 ? (
        <div className="text-center py-16">
          <Trophy className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No Contests Available</h2>
          <p className="text-muted-foreground mb-6">Be the first to create a contest!</p>
          {session?.user && (
            <CreateContestDialog>
              <Button size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Create First Contest
              </Button>
            </CreateContestDialog>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contests.map((contest) => (
            <ContestCard key={contest.id} contest={contest} />
          ))}
        </div>
      )}
    </div>
  );
}
