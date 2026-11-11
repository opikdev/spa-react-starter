import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { errorMessage } from '@/lib/api/problem';
import { useLogOut } from '../hooks';

export function LogoutButton() {
  const logOut = useLogOut();
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-3">
      {logOut.isError && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage(logOut.error)}
        </p>
      )}
      <Button
        variant="secondary"
        disabled={logOut.isPending}
        onClick={() => logOut.mutate(undefined, { onSuccess: () => navigate({ to: '/login' }) })}
      >
        Log out
      </Button>
    </div>
  );
}
