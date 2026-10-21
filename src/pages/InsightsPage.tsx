
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Lightbulb, TrendingUp, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { collectUserChatMessages } from '@/utils/collectChatMessages';
import WellnessScoreCard, { type WellnessScoreData } from '@/components/insights/WellnessScoreCard';
import WeeklyReportCard from '@/components/insights/WeeklyReportCard';
import { getApiBase } from '@/utils/api';
import {
  fetchCurrentWeeklyReport,
  fetchWeeklyReportHistory,
  type WeeklyReport,
} from '@/utils/weeklyReport';

type InsightRecommendation = {
  title: string;
  description: string;
  content: string;
};

const InsightsPage = () => {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<InsightRecommendation[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);
  const [recommendationsEmpty, setRecommendationsEmpty] = useState(false);
  const [wellness, setWellness] = useState<WellnessScoreData | null>(null);
  const [wellnessLoading, setWellnessLoading] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [weeklyReportHistory, setWeeklyReportHistory] = useState<WeeklyReport[]>([]);
  const [weeklyReportLoading, setWeeklyReportLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('Mindful_users');

    if (!userData) {
      setLoading(false);
      return;
    }

    const userId = JSON.parse(userData).id;

    if (!userId) {
      setLoading(false);
      return;
    }

    const apiBase = getApiBase();
    const chatMessages = collectUserChatMessages(userId);

    const fetchRecommendations = async () => {
      setRecommendationsLoading(true);
      setRecommendationsError(null);
      setRecommendationsEmpty(false);

      try {
        const res = await axios.post(
          `${apiBase}/api/insights/${userId}/recommendations`,
          { chatMessages }
        );

        if (res.data.empty) {
          setRecommendations([]);
          setRecommendationsEmpty(true);
          return;
        }

        setRecommendations(res.data.recommendations || []);
      } catch (error) {
        console.error('Failed to fetch AI recommendations:', error);
        const message =
          axios.isAxiosError(error) && error.response?.data?.error
            ? String(error.response.data.error)
            : 'Could not load AI recommendations. Please try again.';
        setRecommendationsError(message);
        setRecommendations([]);
      } finally {
        setRecommendationsLoading(false);
      }
    };

    const fetchInsights = async () => {
      try {
        const res = await axios.get(`${apiBase}/api/insights/${userId}`);

        if (res.data.error) {
          console.error('API returned error:', res.data.error);
          setInsights(null);
          return;
        }

        setInsights(res.data);
      } catch (error) {
        console.error('Failed to fetch insights:', error);
        setInsights(null);
      } finally {
        setLoading(false);
      }
    };

    const fetchWellnessScore = async () => {
      setWellnessLoading(true);
      try {
        const res = await axios.post(`${apiBase}/api/insights/${userId}/wellness-score`, {
          chatMessages,
        });
        setWellness(res.data);
      } catch (error) {
        console.error('Failed to fetch wellness score:', error);
        setWellness(null);
      } finally {
        setWellnessLoading(false);
      }
    };

    fetchInsights();
    fetchRecommendations();
    fetchWellnessScore();

    const fetchWeeklyReport = async () => {
      setWeeklyReportLoading(true);
      try {
        const [current, hist] = await Promise.all([
          fetchCurrentWeeklyReport(),
          fetchWeeklyReportHistory(16),
        ]);
        setWeeklyReport(current.report);
        setWeeklyReportHistory(hist.history?.length ? hist.history : hist.reports || []);
      } catch (error) {
        console.error('Failed to fetch weekly report:', error);
        setWeeklyReport(null);
      } finally {
        setWeeklyReportLoading(false);
      }
    };
    fetchWeeklyReport();
  }, []);
  
     if (loading) {
    return <div className="text-center py-20 text-muted-foreground">Loading insights...</div>;
  }

  const {
    weeklyAverageMood,
    mostFrequentMood,
    journalEntries,
    streak,
    weeklyMoodData,
    monthlyMoodData,
    personalizedInsights,
  } = insights || {};

  // Fallback data if backend doesn't provide chart data
  const fallbackWeeklyData = [
    { day: 'Mon', value: 3, mood: 'neutral' },
    { day: 'Tue', value: 3, mood: 'neutral' },
    { day: 'Wed', value: 3, mood: 'neutral' },
    { day: 'Thu', value: 3, mood: 'neutral' },
    { day: 'Fri', value: 3, mood: 'neutral' },
    { day: 'Sat', value: 3, mood: 'neutral' },
    { day: 'Sun', value: 3, mood: 'neutral' }
  ];

  const fallbackMonthlyData = [
    { name: 'No Data', value: 1 }
  ];

  // Use backend data if available, otherwise use fallback
  const chartWeeklyData = weeklyMoodData && weeklyMoodData.length > 0 ? weeklyMoodData : fallbackWeeklyData;
  const chartMonthlyData = monthlyMoodData && monthlyMoodData.length > 0 ? monthlyMoodData : fallbackMonthlyData;
  const improvementValue = Number.parseFloat(String(weeklyAverageMood?.improvement ?? '0').replace('%', '')) || 0;
  const negativeMoods = new Set(['angry', 'sad', 'anxious', 'tired']);
  const isNegativeMoodTrend = negativeMoods.has(String(mostFrequentMood?.mood ?? '').toLowerCase());
  const showMoodDecline = isNegativeMoodTrend || improvementValue < 0;
  const journalChangeValue = Number.parseFloat(String(journalEntries?.change ?? '0').replace('%', '')) || 0;
  const showJournalGrowth = journalChangeValue >= 0 || Number(journalEntries?.thisWeek ?? 0) > 0;
  
  const COLORS = ['#4CAF50', '#2196F3', '#FFC107', '#9C27B0', '#F44336'];
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Emotional Insights</h1>
        <p className="text-muted-foreground">Understand your emotional patterns and get personalized insights</p>
        {(!insights?.journalEntries?.total || insights.journalEntries.total === 0) && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">
              💡 <strong>Tip:</strong> Start journaling to see your mood trends and insights!
            </p>
          </div>
        )}
      </div>

      <WellnessScoreCard data={wellness} loading={wellnessLoading} />
      <WeeklyReportCard
        report={weeklyReport}
        history={weeklyReportHistory}
        loading={weeklyReportLoading}
      />
      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Weekly Average Mood</CardDescription>
            <CardTitle className="text-2xl">{weeklyAverageMood?.label ?? 'N/A'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                {weeklyAverageMood?.improvement || '0%'} {showMoodDecline ? 'declining' : 'improving'}
              </span>
              {showMoodDecline ? (
                <ArrowDownRight className="text-red-500 h-4 w-4" />
              ) : (
                <ArrowUpRight className="text-green-500 h-4 w-4" />
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Most Frequent Mood</CardDescription>
            <CardTitle className="text-2xl">{mostFrequentMood?.mood ?? 'N/A'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm"> {mostFrequentMood?.count ?? 0} occurrences</span>
              <span className="text-xl">{mostFrequentMood?.emoji ?? '🙂'}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Journal Entries</CardDescription>
            <CardTitle className="text-2xl">{journalEntries?.total ?? 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                {journalEntries?.thisWeek ?? 0} this week ({journalEntries?.change ?? '0%'})
              </span>
              {showJournalGrowth ? (
                <ArrowUpRight className="text-green-500 h-4 w-4" />
              ) : (
                <ArrowDownRight className="text-red-500 h-4 w-4" />
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Consecutive Days</CardDescription>
            <CardTitle className="text-2xl">{streak?.consecutiveDays ?? 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Keep it up!</span>
              <span className="text-xl">🔥</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="mood-trends">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="mood-trends">Mood Trends</TabsTrigger>
          <TabsTrigger value="insights">Personalized Insights</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="mood-trends">
          {(!insights?.journalEntries?.total || insights.journalEntries.total === 0) ? (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold mb-2">No Journal Entries Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start journaling to see your mood trends and insights. Your first entry will appear here!
                </p>
                <Button asChild>
                  <Link to="/journal">Start Journaling</Link>
                </Button>
              </div>
            </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Mood Trends</CardTitle>
                <CardDescription>See how your mood has changed over the past week</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {chartWeeklyData && chartWeeklyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartWeeklyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis
                        tickFormatter={(value) => {
                          const moods = ['', 'Very Sad', 'Sad', 'Neutral', 'Happy', 'Very Happy'];
                          return moods[value] || '';
                        }}
                      />
                      <Tooltip 
                        formatter={(value) => {
                          const moods = ['', 'Very Sad', 'Sad', 'Neutral', 'Happy', 'Very Happy'];
                          return [moods[value as number], 'Mood Level'];
                        }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>No mood data available for this week. Start journaling to see your mood trends!</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Monthly Mood Distribution</CardTitle>
                <CardDescription>Breakdown of your emotions over the past month</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {chartMonthlyData && chartMonthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartMonthlyData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {chartMonthlyData?.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>No mood data available for this month. Start journaling to see your mood distribution!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          )}
        </TabsContent>
        
        <TabsContent value="insights">
          {(!personalizedInsights || personalizedInsights.length === 0) ? (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-4">💡</div>
                <h3 className="text-xl font-semibold mb-2">No Insights Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start journaling to unlock personalized insights based on your mood patterns and journal entries.
                </p>
                <Button asChild>
                  <Link to="/journal">Start Journaling</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {personalizedInsights.map((insight, index) => (
                <Card key={index} className={`overflow-hidden ${insight.type === 'goals' ? 'md:col-span-2' : ''}`}>
                  <div className={`h-1 ${
                    insight.color === 'primary' ? 'bg-primary' :
                    insight.color === 'amber' ? 'bg-amber-500' :
                    insight.color === 'teal' ? 'bg-teal-500' : 'bg-primary'
                  }`}></div>
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className={`w-10 h-10 rounded-full ${
                      insight.color === 'primary' ? 'bg-primary/10' :
                      insight.color === 'amber' ? 'bg-amber-500/10' :
                      insight.color === 'teal' ? 'bg-teal-500/10' : 'bg-primary/10'
                    } flex items-center justify-center`}>
                      {insight.icon === 'Lightbulb' && <Lightbulb className={`w-5 h-5 ${
                        insight.color === 'primary' ? 'text-primary' :
                        insight.color === 'amber' ? 'text-amber-500' :
                        insight.color === 'teal' ? 'text-teal-500' : 'text-primary'
                      }`} />}
                      {insight.icon === 'TrendingUp' && <TrendingUp className={`w-5 h-5 ${
                        insight.color === 'primary' ? 'text-primary' :
                        insight.color === 'amber' ? 'text-amber-500' :
                        insight.color === 'teal' ? 'text-teal-500' : 'text-primary'
                      }`} />}
                      {insight.icon === 'Target' && <Target className={`w-5 h-5 ${
                        insight.color === 'primary' ? 'text-primary' :
                        insight.color === 'amber' ? 'text-amber-500' :
                        insight.color === 'teal' ? 'text-teal-500' : 'text-primary'
                      }`} />}
                    </div>
                    <div>
                      <CardTitle>{insight.title}</CardTitle>
                      <CardDescription>{insight.description}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {insight.type === 'goals' ? (
                      <div className="space-y-4">
                        {insight.goals.map((goal, goalIndex) => (
                          <div key={goalIndex}>
                            <div className="flex justify-between text-sm mb-1">
                              <span>{goal.name}</span>
                              <span>{goal.current}/{goal.target}</span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full">
                              <div 
                                className="h-full bg-teal-500 rounded-full" 
                                style={{ width: `${goal.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>{insight.content}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="recommendations">
          {recommendationsLoading ? (
            <div className="text-center py-20 text-muted-foreground">
              Generating personalized recommendations from your journals and chats…
            </div>
          ) : recommendationsError ? (
            <div className="text-center py-20 max-w-md mx-auto">
              <p className="text-muted-foreground mb-4">{recommendationsError}</p>
              <Button
                variant="outline"
                onClick={() => {
                  const userData = localStorage.getItem('Mindful_users');
                  if (!userData) return;
                  const userId = JSON.parse(userData).id;
                  if (!userId) return;
                  setRecommendationsLoading(true);
                  setRecommendationsError(null);
                  axios
                    .post(`http://localhost:4000/api/insights/${userId}/recommendations`, {
                      chatMessages: collectUserChatMessages(userId),
                    })
                    .then((res) => {
                      if (res.data.empty) {
                        setRecommendations([]);
                        setRecommendationsEmpty(true);
                      } else {
                        setRecommendations(res.data.recommendations || []);
                        setRecommendationsEmpty(false);
                      }
                    })
                    .catch(() => setRecommendationsError('Could not load AI recommendations. Please try again.'))
                    .finally(() => setRecommendationsLoading(false));
                }}
              >
                Try again
              </Button>
            </div>
          ) : recommendationsEmpty || recommendations.length === 0 ? (
            <div className="text-center py-20 max-w-md mx-auto">
              <div className="text-6xl mb-4">✨</div>
              <h3 className="text-xl font-semibold mb-2">No recommendations yet</h3>
              <p className="text-muted-foreground mb-4">
                Recommendations are generated by AI from your mood journals and Mindful chat conversations.
                Start journaling or chatting to unlock personalized suggestions.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild>
                  <Link to="/journal">Start Journaling</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/chat">Talk to Mindful</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((item, i) => (
                <Card key={i} className="card-hover">
                  <CardHeader>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>{item.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InsightsPage;
