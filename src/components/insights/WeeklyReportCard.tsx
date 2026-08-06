import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, AlertCircle, Lightbulb } from 'lucide-react';
import type { WeeklyReport } from '@/utils/weeklyReport';

type Props = {
  report: WeeklyReport | null;
  loading?: boolean;
};

const WeeklyReportCard = ({ report, loading }: Props) => {
  if (loading) {
    return (
      <Card className="mb-8">
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading your weekly mental health report…
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card className="mb-8 border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Weekly Mental Health Report
          </CardTitle>
          <CardDescription>
            Journal and chat with MindCare for a few days — your AI weekly report appears here every Monday.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mb-8 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Weekly Mental Health Report
        </CardTitle>
        <CardDescription>{report.weekKey?.replace('-W', ' · Week ')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="text-base leading-relaxed font-medium">{report.summary}</p>

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
      </CardContent>
    </Card>
  );
};

export default WeeklyReportCard;
