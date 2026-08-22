import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, AlertCircle, Lightbulb, History } from 'lucide-react';
import type { WeeklyReport } from '@/utils/weeklyReport';
import { formatWeekRange } from '@/utils/weeklyReport';
import WeeklyReportModal from '@/components/reports/WeeklyReportModal';

type Props = {
  report: WeeklyReport | null;
  history?: WeeklyReport[];
  loading?: boolean;
};

function ReportBody({ report }: { report: WeeklyReport }) {
  return (
    <div className="space-y-4 text-sm">
      <p className="text-base leading-relaxed font-medium">{report.summary}</p>

      {report.activityStats && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg border p-2">
            <p className="text-lg font-semibold">{report.activityStats.journalEntries ?? 0}</p>
            <p className="text-xs text-muted-foreground">Journals</p>
          </div>
          <div className="rounded-lg border p-2">
            <p className="text-lg font-semibold">{report.activityStats.conversations ?? 0}</p>
            <p className="text-xs text-muted-foreground">Chats</p>
          </div>
          <div className="rounded-lg border p-2">
            <p className="text-lg font-semibold">
              {report.activityStats.exerciseCompletions ??
                report.activityStats.activitiesCompleted ??
                0}
            </p>
            <p className="text-xs text-muted-foreground">Exercises</p>
          </div>
        </div>
      )}

      {report.dominantMoods && report.dominantMoods.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {report.dominantMoods.map((m) => (
            <Badge key={m} variant="outline">
              {m}
            </Badge>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {report.stressTriggers && report.stressTriggers.length > 0 && (
          <div className="rounded-lg border p-3">
            <p className="font-medium flex items-center gap-1 mb-1">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Stress triggers
            </p>
            <ul className="text-muted-foreground list-disc list-inside">
              {report.stressTriggers.slice(0, 3).map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        )}
        {report.positiveImprovements && report.positiveImprovements.length > 0 && (
          <div className="rounded-lg border p-3">
            <p className="font-medium flex items-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Improvements
            </p>
            <ul className="text-muted-foreground list-disc list-inside">
              {report.positiveImprovements.slice(0, 3).map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {report.recommendations && report.recommendations.length > 0 && (
        <div className="rounded-lg bg-primary/5 p-3">
          <p className="font-medium flex items-center gap-1 mb-1">
            <Lightbulb className="h-4 w-4 text-primary" />
            Recommendations
          </p>
          <ul className="text-muted-foreground list-disc list-inside">
            {report.recommendations.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const WeeklyReportCard = ({ report, history = [], loading }: Props) => {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<WeeklyReport | null>(null);

  const pastReports = history.filter(
    (r) => r._id !== report?._id && (r.finalized || r.tense === 'last')
  );

  if (loading) {
    return (
      <Card className="mb-8">
        <CardContent className="py-8 text-center text-muted-foreground">
          Updating your weekly mental health report from the latest activity…
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="mb-8 border-primary/20">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                Weekly Mental Health Report
              </CardTitle>
              <CardDescription>
                {report
                  ? `${formatWeekRange(report)} · Live this week (updates when you open Insights)`
                  : 'Journal, chat, or complete an exercise — your report builds as you go'}
              </CardDescription>
            </div>
            {pastReports.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => setHistoryOpen((v) => !v)}
              >
                <History className="h-4 w-4" />
                History
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!report ? (
            <p className="text-sm text-muted-foreground">
              No activity recorded for this Monday–Sunday week yet. After you chat, journal, or mark a
              resource complete, reopen Insights to see “This week, you did…”.
            </p>
          ) : (
            <ReportBody report={report} />
          )}

          {historyOpen && pastReports.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <History className="h-4 w-4" />
                Weekly report history
              </h4>
              <ul className="space-y-2">
                {pastReports.map((item) => (
                  <li key={item._id}>
                    <button
                      type="button"
                      className="w-full text-left rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedHistory(item)}
                    >
                      <p className="text-sm font-medium">{formatWeekRange(item)}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.summary}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <WeeklyReportModal
        report={selectedHistory}
        open={Boolean(selectedHistory)}
        onOpenChange={(open) => {
          if (!open) setSelectedHistory(null);
        }}
        onDismiss={() => setSelectedHistory(null)}
        variant="last-week"
      />
    </>
  );
};

export default WeeklyReportCard;
