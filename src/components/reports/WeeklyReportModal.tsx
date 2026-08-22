import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, AlertCircle, Lightbulb } from 'lucide-react';
import type { WeeklyReport } from '@/utils/weeklyReport';
import { formatWeekRange } from '@/utils/weeklyReport';

type Props = {
  report: WeeklyReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDismiss: () => void;
  variant?: 'last-week' | 'this-week';
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const WeeklyReportModal = ({
  report,
  open,
  onOpenChange,
  onDismiss,
  variant = 'last-week',
}: Props) => {
  if (!report) return null;

  const title =
    variant === 'last-week' || report.tense === 'last'
      ? 'Last week’s mental health report'
      : 'This week’s mental health report';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Sparkles className="h-5 w-5" />
            <span className="text-xs font-medium uppercase tracking-wide">
              {variant === 'last-week' ? 'Previous week wrap-up' : 'Weekly report'}
            </span>
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {formatWeekRange(report)} · Based on your journals, chats, and wellness activities
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <p className="text-base leading-relaxed font-medium border-l-4 border-primary pl-3 py-1">
            {report.summary}
          </p>

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

          {report.emotionalSummary && (
            <section>
              <h4 className="font-semibold mb-1">Emotional summary</h4>
              <p className="text-muted-foreground">{report.emotionalSummary}</p>
            </section>
          )}

          {report.dominantMoods && report.dominantMoods.length > 0 && (
            <section>
              <h4 className="font-semibold mb-2">Dominant moods</h4>
              <div className="flex flex-wrap gap-2">
                {report.dominantMoods.map((mood) => (
                  <Badge key={mood} variant="secondary">
                    {capitalize(mood)}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {report.stressTriggers && report.stressTriggers.length > 0 && (
            <section>
              <h4 className="font-semibold mb-2 flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                Stress triggers
              </h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                {report.stressTriggers.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          {report.positiveImprovements && report.positiveImprovements.length > 0 && (
            <section>
              <h4 className="font-semibold mb-2 flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Positive improvements
              </h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                {report.positiveImprovements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          {report.recommendations && report.recommendations.length > 0 && (
            <section>
              <h4 className="font-semibold mb-2 flex items-center gap-1">
                <Lightbulb className="h-4 w-4 text-primary" />
                Personalized recommendations
              </h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                {report.recommendations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onDismiss} className="w-full sm:w-auto">
            Got it, thanks
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WeeklyReportModal;
