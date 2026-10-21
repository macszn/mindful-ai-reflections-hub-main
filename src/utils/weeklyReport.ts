import { getApiBase, getAuthHeaders, getStoredUser } from '@/utils/api';

export type WeeklyActivityStats = {
  journalEntries?: number;
  conversations?: number;
  activitiesCompleted?: number;
  exerciseCompletions?: number;
  articleCompletions?: number;
  mediaCompletions?: number;
};

export type WeeklyReport = {
  _id: string;
  weekKey: string;
  weekStart: string;
  weekEnd: string;
  tense?: 'this' | 'last';
  finalized?: boolean;
  summary: string;
  emotionalSummary?: string;
  dominantMoods?: string[];
  stressTriggers?: string[];
  positiveImprovements?: string[];
  recommendations?: string[];
  activityStats?: WeeklyActivityStats;
  seenAt?: string | null;
  generatedAt?: string;
  reflection?: {
    learned?: string;
    helped?: string;
    nextWeek?: string;
    completedAt?: string | null;
  };
};

export async function fetchCurrentWeeklyReport(): Promise<{
  report: WeeklyReport | null;
  weekKey?: string;
  message?: string | null;
}> {
  const user = getStoredUser();
  if (!user?.id) return { report: null };

  const res = await fetch(`${getApiBase()}/api/weekly-reports/${user.id}/current`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load weekly report');
  return res.json();
}

/** @deprecated Use fetchCurrentWeeklyReport */
export async function fetchLatestWeeklyReport(): Promise<{
  report: WeeklyReport | null;
  unseen: boolean;
}> {
  const data = await fetchCurrentWeeklyReport();
  return { report: data.report, unseen: false };
}

export async function fetchMondayModalReport(): Promise<{
  show: boolean;
  reason?: string;
  report: WeeklyReport | null;
  inMondayWindow?: boolean;
}> {
  const user = getStoredUser();
  if (!user?.id) return { show: false, report: null };

  const res = await fetch(`${getApiBase()}/api/weekly-reports/${user.id}/monday-modal`);
  if (!res.ok) throw new Error('Failed to load Monday report modal');
  return res.json();
}

export async function markWeeklyReportSeen(reportId: string) {
  const user = getStoredUser();
  if (!user?.id) return;

  await fetch(`${getApiBase()}/api/weekly-reports/${user.id}/${reportId}/seen`, {
    method: 'POST',
  });
}

export async function fetchWeeklyReportHistory(limit = 16): Promise<{
  reports: WeeklyReport[];
  history: WeeklyReport[];
  currentWeekKey?: string;
}> {
  const user = getStoredUser();
  if (!user?.id) return { reports: [], history: [] };

  const res = await fetch(`${getApiBase()}/api/weekly-reports/${user.id}?limit=${limit}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) return { reports: [], history: [] };
  return res.json();
}

export async function saveWeeklyReflection(
  reportId: string,
  reflection: { learned: string; helped: string; nextWeek: string }
) {
  const user = getStoredUser();
  if (!user?.id) throw new Error('Please sign in to save your reflection');

  const response = await fetch(
    `${getApiBase()}/api/weekly-reports/${user.id}/${reportId}/reflection`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(reflection),
    }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Failed to save your reflection');
  return data.reflection as NonNullable<WeeklyReport['reflection']>;
}

export function formatWeekRange(report: WeeklyReport) {
  try {
    const start = new Date(report.weekStart);
    const end = new Date(report.weekEnd);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, {
      ...opts,
      year: 'numeric',
    })}`;
  } catch {
    return report.weekKey?.replace('-W', ' · Week ') || 'Weekly report';
  }
}
