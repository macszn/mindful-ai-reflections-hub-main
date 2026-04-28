
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Lightbulb, TrendingUp, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import axios from 'axios';

// Mock data for the charts
// const weeklyMoodData = [
//   { day: 'Mon', value: 3, mood: 'anxious' },
//   { day: 'Tue', value: 2, mood: 'sad' },
//   { day: 'Wed', value: 4, mood: 'calm' },
//   { day: 'Thu', value: 5, mood: 'happy' },
//   { day: 'Fri', value: 4, mood: 'calm' },
//   { day: 'Sat', value: 5, mood: 'happy' },
//   { day: 'Sun', value: 5, mood: 'excited' },
// ];

// const monthlyMoodData = [
//   { name: 'Happy', value: 12 },
//   { name: 'Calm', value: 8 },
//   { name: 'Anxious', value: 6 },
//   { name: 'Sad', value: 4 },
//   { name: 'Angry', value: 2 },
// ];


const InsightsPage = () => {
  const [loading, setLoading] = useState(true);
   const [insights, setInsights] = useState<any>(null);
  
     useEffect(() => {
    const userData = localStorage.getItem('MindCare_users');
    console.log('User data from localStorage:', userData);
    
    if (!userData) {
      console.log('No user data found in localStorage');
      return;
    }
    
    const userId = JSON.parse(userData).id;
    console.log('Extracted userId:', userId);
    
    if (!userId) {
      console.log('No userId found in user data');
      return;
    }

          const fetchInsights = async () => {
        try {
          const res = await axios.get(`http://localhost:4000/api/insights/${userId}`);
          
          if (res.data.error) {
            console.error('API returned error:', res.data.error);
            setInsights(null);
            return;
          }
          
          setInsights(res.data);
                  console.log('Insights data received:', res.data);
        console.log('Weekly mood data:', res.data.weeklyMoodData);
        console.log('Monthly mood data:', res.data.monthlyMoodData);
        console.log('Personalized insights:', res.data.personalizedInsights);
        } catch (error) {
          console.error('Failed to fetch insights:', error);
          setInsights(null);
        } finally {
          setLoading(false);
        }
      };

    fetchInsights();
  }, []);
  
     if (loading) {
    return <div className="text-center py-20 text-muted-foreground">Loading insights...</div>;
  }

  if (!insights) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="text-center py-20">
          <h1 className="text-3xl font-bold mb-2">Emotional Insights</h1>
          <p className="text-muted-foreground mb-4">Unable to load insights data</p>
          <p className="text-sm text-muted-foreground">Please try refreshing the page or check if you have any journal entries.</p>
        </div>
      </div>
    );
  }
  
     const {
    weeklyAverageMood,
    mostFrequentMood,
    journalEntries,
    streak,
    weeklyMoodData,
    monthlyMoodData,
    personalizedInsights
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

      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Weekly Average Mood</CardDescription>
            <CardTitle className="text-2xl">{weeklyAverageMood?.label ?? 'N/A'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">{weeklyAverageMood?.improvement || '0%'} improvement</span>
              <ArrowUpRight className="text-green-500 h-4 w-4" />
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
              <span className="text-muted-foreground text-sm">{journalEntries?.thisWeek ?? 0} this week</span>
              <ArrowDownRight className="text-red-500 h-4 w-4" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Stress Management",
                description: "Based on your anxiety patterns",
                content: "Try the 4-7-8 breathing technique: inhale for 4 seconds, hold for 7, exhale for 8. This can help reduce stress levels quickly."
              },
              {
                title: "Sleep Improvement",
                description: "Your sleep quality affects your mood",
                content: "Consider creating a bedtime routine by turning off screens 1 hour before bed and reading or meditating instead."
              },
              {
                title: "Social Connection",
                description: "Important for emotional wellbeing",
                content: "You've mentioned feeling isolated. Consider scheduling a weekly social activity, even a brief coffee with a friend."
              },
              {
                title: "Physical Activity",
                description: "Boosts mood and reduces anxiety",
                content: "Even short 10-minute walks can significantly improve your mood. Try to incorporate movement into your daily routine."
              },
              {
                title: "Gratitude Practice",
                description: "Shifts focus to positive aspects",
                content: "Consider writing down 3 things you're grateful for each morning to prime your mind for positive thinking."
              },
              {
                title: "Self-compassion",
                description: "Be kind to yourself",
                content: "Notice your negative self-talk and try to speak to yourself with the kindness you'd offer a good friend."
              },
            ].map((item, i) => (
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InsightsPage;
