import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Star } from 'lucide-react';

export type WellnessScoreData = {
  score: number;
  stars: number;
  label?: string;
  components?: {
    journals: number;
    sentiment: number;
    activity: number;
    trends: number;
  };
  history?: Array<{
    date: string;
    label: string;
    score: number;
    stars: number;
  }>;
  meta?: {
    journalEntriesThisWeek?: number;
    activitiesThisWeek?: number;
  };
};

type Props = {
  data: WellnessScoreData | null;
  loading?: boolean;
};

function Stars({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-5 w-5 ${i < count ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  );
}

const COMPONENT_LABELS: Record<string, string> = {
  journals: 'Mood journals',
  sentiment: 'Conversation sentiment',
  activity: 'Activity completion',
  trends: 'Emotional trends',
};

const WellnessScoreCard = ({ data, loading }: Props) => {
  if (loading) {
    return (
      <Card className="mb-8">
        <CardContent className="py-10 text-center text-muted-foreground">
          Calculating your wellness score…
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const components = data.components || {
    journals: 0,
    sentiment: 0,
    activity: 0,
    trends: 0,
  };

  const history =
    data.history && data.history.length > 0
      ? data.history
      : [{ date: new Date().toISOString().slice(0, 10), label: 'Today', score: data.score, stars: data.stars }];

  return (
    <div className="space-y-6 mb-8">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
        <CardHeader className="pb-2">
          <CardDescription>Mental Wellness Progress Score</CardDescription>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <CardTitle className="text-4xl font-bold tracking-tight">{data.score}<span className="text-lg text-muted-foreground font-normal">/100</span></CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{data.label || 'Your current wellbeing snapshot'}</p>
            </div>
            <Stars count={data.stars} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={data.score} className="h-2" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(components).map(([key, value]) => (
              <div key={key} className="rounded-lg border bg-background/80 p-3">
                <p className="text-xs text-muted-foreground mb-1">{COMPONENT_LABELS[key] || key}</p>
                <p className="text-lg font-semibold">{value}</p>
                <Progress value={value} className="h-1 mt-2" />
              </div>
            ))}
          </div>
          {(data.meta?.journalEntriesThisWeek != null || data.meta?.activitiesThisWeek != null) && (
            <p className="text-xs text-muted-foreground">
              This week: {data.meta.journalEntriesThisWeek ?? 0} journal entries ·{' '}
              {data.meta.activitiesThisWeek ?? 0} activities completed
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Progress over time</CardTitle>
          <CardDescription>How your wellness score has changed day by day</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="wellnessFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => [`${value}/100`, 'Score']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                fill="url(#wellnessFill)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default WellnessScoreCard;
