import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Lightbulb, TrendingUp, Target } from 'lucide-react';
import './Insights.css';

const COLORS = ['#4CAF50', '#2196F3', '#FFC107', '#9C27B0', '#F44336'];

const InsightsPage = () => {
  const [insightsData, setInsightsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (!token || !userId) {
        setError('Please login to view insights');
        setLoading(false);
        return;
      }

      const response = await fetch(`http://localhost:4000/api/insights?userId=${userId}`, {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }

      const data = await response.json();
      setInsightsData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-muted-foreground">{error}</p>
          <button 
            onClick={fetchInsights}
            className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!insightsData) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Data Available</h2>
          <p className="text-muted-foreground">Start journaling to see your insights!</p>
        </div>
      </div>
    );
  }

  const { stats, weeklyMoodData, monthlyMoodData, insights, recommendations } = insightsData;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Emotional Insights</h1>
        <p className="text-muted-foreground">Understand your emotional patterns and get personalized insights</p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Weekly Average Mood</CardDescription>
            <CardTitle className="text-2xl">{stats.weeklyAverageMood.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                {parseInt(stats.weeklyAverageMood.improvement) > 0 ? '+' : ''}{stats.weeklyAverageMood.improvement} improvement
              </span>
              {parseInt(stats.weeklyAverageMood.improvement) > 0 ? (
                <ArrowUpRight className="text-green-500 h-4 w-4" />
              ) : (
                <ArrowDownRight className="text-red-500 h-4 w-4" />
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Most Frequent Mood</CardDescription>
            <CardTitle className="text-2xl capitalize">{stats.mostFrequentMood.value}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">{stats.mostFrequentMood.count} occurrences</span>
              <span className="text-xl">
                {stats.mostFrequentMood.value === 'happy' && '😊'}
                {stats.mostFrequentMood.value === 'sad' && '😢'}
                {stats.mostFrequentMood.value === 'anxious' && '😰'}
                {stats.mostFrequentMood.value === 'calm' && '😌'}
                {stats.mostFrequentMood.value === 'angry' && '😠'}
                {stats.mostFrequentMood.value === 'excited' && '🤩'}
                {stats.mostFrequentMood.value === 'grateful' && '🙏'}
                {stats.mostFrequentMood.value === 'tired' && '😴'}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Journal Entries</CardDescription>
            <CardTitle className="text-2xl">{stats.journalEntries.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">{stats.journalEntries.thisWeek} this week</span>
              <ArrowDownRight className="text-red-500 h-4 w-4" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Consecutive Days</CardDescription>
            <CardTitle className="text-2xl">{stats.consecutiveDays}</CardTitle>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Mood Trends</CardTitle>
                <CardDescription>See how your mood has changed over the past week</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyMoodData}>
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
                        return [moods[value], 'Mood Level'];
                      }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Monthly Mood Distribution</CardTitle>
                <CardDescription>Breakdown of your emotions over the past month</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={monthlyMoodData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {monthlyMoodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="insights">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {insights.map((insight, index) => (
              <Card key={index} className="overflow-hidden">
                <div className={`h-1 ${
                  insight.type === 'mood-patterns' ? 'bg-primary' :
                  insight.type === 'progress' ? 'bg-amber-500' :
                  'bg-teal-500'
                }`}></div>
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    insight.type === 'mood-patterns' ? 'bg-primary/10' :
                    insight.type === 'progress' ? 'bg-amber-500/10' :
                    'bg-teal-500/10'
                  }`}>
                    {insight.type === 'mood-patterns' && <Lightbulb className="w-5 h-5 text-primary" />}
                    {insight.type === 'progress' && <TrendingUp className="w-5 h-5 text-amber-500" />}
                    {insight.type === 'goals' && <Target className="w-5 h-5 text-teal-500" />}
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
                              style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
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
        </TabsContent>
        
        <TabsContent value="recommendations">
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InsightsPage; 