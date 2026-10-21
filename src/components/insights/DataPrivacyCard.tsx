import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
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
import { getApiBase, getAuthHeaders, getStoredUser } from '@/utils/api';

type SavedMemory = {
  consentEnabled: boolean;
  discussions: Array<{ summary: string; recordedAt: string }>;
  triggers: Array<{ label: string; mentionCount: number }>;
  goals: Array<{ text: string; status: string }>;
};

const EMPTY_MEMORY: SavedMemory = {
  consentEnabled: false,
  discussions: [],
  triggers: [],
  goals: [],
};

async function readResponse(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Could not update privacy settings');
  }
  return data;
}

type Props = {
  onAccountDeleted: () => void;
};

const DataPrivacyCard = ({ onAccountDeleted }: Props) => {
  const user = getStoredUser();
  const [memory, setMemory] = useState<SavedMemory>(EMPTY_MEMORY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetch(`${getApiBase()}/api/memory/${user.id}`, { headers: getAuthHeaders() })
      .then(readResponse)
      .then((data: SavedMemory) => {
        if (!cancelled) setMemory({ ...EMPTY_MEMORY, ...data });
      })
      .catch((fetchError: unknown) => {
        console.error('Failed to load saved memory settings:', fetchError);
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : 'Could not load privacy settings');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  const updateConsent = async (enabled: boolean) => {
    if (!user?.id) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`${getApiBase()}/api/memory/${user.id}/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ enabled }),
      });
      await readResponse(response);
      setMemory((current) => ({
        ...current,
        consentEnabled: enabled,
        discussions: enabled ? current.discussions : [],
        triggers: enabled ? current.triggers : [],
        goals: enabled ? current.goals : [],
      }));
      if (enabled) {
        const refresh = await fetch(`${getApiBase()}/api/memory/${user.id}`, {
          headers: getAuthHeaders(),
        });
        const saved = await readResponse(refresh);
        setMemory({ ...EMPTY_MEMORY, ...saved });
      }
    } catch (saveError: unknown) {
      console.error('Failed to update saved memory consent:', saveError);
      setError(saveError instanceof Error ? saveError.message : 'Could not update privacy settings');
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (!user?.id) return;
    setDeletingAccount(true);
    setError('');
    try {
      const response = await fetch(`${getApiBase()}/api/account/${user.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      await readResponse(response);

      const chatPrefix = `chat_${user.id}_`;
      const userKeys = Object.keys(localStorage).filter(
        (key) => key === `chats_list_${user.id}` || key.startsWith(chatPrefix)
      );
      userKeys.forEach((key) => localStorage.removeItem(key));
      setDeleteDialogOpen(false);
      onAccountDeleted();
    } catch (deleteError: unknown) {
      console.error('Failed to delete account and data:', deleteError);
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete account and data');
    } finally {
      setDeletingAccount(false);
    }
  };

  if (!user?.id) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Privacy, memory &amp; your data</CardTitle>
          <CardDescription>
            Review what Mindful remembers and manage your account data. Cross-session memory is off until
            you choose to turn it on. Chat messages and current conversation context are sent to Google
            Gemini to generate replies.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">Remember my emotional journey</p>
              <p className="text-sm text-muted-foreground">
                When enabled, Mindful saves brief chat summaries and journal themes for personalized
                replies, recommendations, and weekly reflections. These are observations, not diagnoses.
              </p>
            </div>
            <Switch
              checked={memory.consentEnabled}
              disabled={loading || saving}
              onCheckedChange={(enabled) => void updateConsent(enabled)}
              aria-label="Remember my emotional journey"
            />
          </div>

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading your privacy settings…</p>
          ) : memory.consentEnabled ? (
            <section className="rounded-lg border p-4">
              <h3 className="font-medium">What Mindful has saved</h3>
              {memory.discussions.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {memory.discussions.slice(-8).map((item, index) => (
                    <li key={`${item.recordedAt}-${index}`}>{item.summary}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">No chat summaries saved yet.</p>
              )}
              <button
                type="button"
                className="mt-4 rounded-md border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
                disabled={saving}
                onClick={() => void updateConsent(false)}
              >
                Turn off and delete saved memory
              </button>
            </section>
          ) : (
            <p className="text-sm text-muted-foreground">
              Off. Mindful will not save chat summaries or journal themes for future personalization.
            </p>
          )}
          <div className="border-t pt-5">
            <h3 className="font-medium">Delete account and data</h3>
            <p className="mb-3 mt-1 text-sm text-muted-foreground">
              Permanently delete your account, journal entries, saved reflections, reports, activities,
              and chat data. Local chat copies on this browser are also removed. This cannot be undone.
            </p>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              Delete my account and data
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account and data?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes your account and associated journal entries, saved chat
              reflections, weekly reports, activities, and local chat copies from this browser.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingAccount}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletingAccount}
              onClick={(event) => {
                event.preventDefault();
                void deleteAccount();
              }}
            >
              {deletingAccount ? 'Deleting…' : 'Delete account and data'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DataPrivacyCard;