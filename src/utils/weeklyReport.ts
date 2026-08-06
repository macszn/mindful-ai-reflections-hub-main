import { getApiBase, getStoredUser } from '@/utils/api';

export type WeeklyReport = {
  _id: string;
  weekKey: string;
  weekStart: string;
  weekEnd: string;
  summary: string;
  emotionalSummary?: string;
  dominantMoods?: string[];
  stressTriggers?: string[];
  positiveImprovements?: string[];
  recommendations?: string[];
  seenAt?: string | null;
  generatedAt?: string;
};

export async function fetchLatestWeeklyReport(): Promise<{
  report: WeeklyReport | null;
  unseen: boolean;
}> {
  const user = getStoredUser();
  if (!user?.id) return { report: null, unseen: false };

  const res = await fetch(`${getApiBase()}/api/weekly-reports/${user.id}/latest`);
  if (!res.ok) throw new Error('Failed to load weekly report');
  return res.json();
}

export async function markWeeklyReportSeen(reportId: string) {
  const user = getStoredUser();
  if (!user?.id) return;

  await fetch(`${getApiBase()}/api/weekly-reports/${user.id}/${reportId}/seen`, {
    method: 'POST',
  });
}

export async function fetchWeeklyReportHistory(limit = 8): Promise<WeeklyReport[]> {
  const user = getStoredUser();
  if (!user?.id) return [];

  const res = await fetch(`${getApiBase()}/api/weekly-reports/${user.id}?limit=${limit}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.reports || [];
}
