import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Brain, BarChart4, BookOpen, MessageSquare, ArrowRight, Shield, Clock, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { getRandomQuote } from '@/utils/quotes';

const QUOTE_STORAGE_KEY = 'MindCare_quote_of_the_day';
const QUOTE_TIMESTAMP_KEY = 'MindCare_quote_timestamp';

const getStoredQuote = () => {
  const quote = localStorage.getItem(QUOTE_STORAGE_KEY);
  const timestamp = localStorage.getItem(QUOTE_TIMESTAMP_KEY);
  if (quote && timestamp) {
    return { quote: JSON.parse(quote), timestamp: parseInt(timestamp, 10) };
  }
  return null;
};

const setStoredQuote = (quote: { text: string; author: string }) => {
  localStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify(quote));
  localStorage.setItem(QUOTE_TIMESTAMP_KEY, Date.now().toString());
};

const Index = () => {
  const { user } = useAuth();
  const [quote, setQuote] = useState({ text: '', author: '' });
  
  useEffect(() => {
    if (user) {
      const stored = getStoredQuote();
      const now = Date.now();
      const DAY_MS = 24 * 60 * 60 * 1000;
      if (stored && now - stored.timestamp < DAY_MS) {
        setQuote(stored.quote);
      } else {
        const newQuote = getRandomQuote();
        setQuote(newQuote);
        setStoredQuote(newQuote);
      }
    }
  }, [user]);

  const showLoginNotice = () => {
    toast('Create an account to save your progress!', {
      icon: '👋',
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/30 to-background -z-10" />
        <div className="container-custom flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex-1 text-center md:text-left slide-up" style={{ animationDelay: '0.1s' }}>
            {user ? (
              <>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  Quote of the day
                </h1>
                <div className="mt-6 bg-white/30 backdrop-blur-sm p-6 rounded-lg border border-accent">
                  <p className="text-xl italic text-foreground">{quote.text}</p>
                  <p className="mt-2 text-right text-sm text-muted-foreground">— {quote.author}</p>
                </div>
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <Link to="/chat">
                    <Button size="lg" className="gap-2">
                      Start Chatting <MessageSquare className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/journal">
                    <Button size="lg" variant="outline" className="gap-2">
                      Go to Journal <BookOpen className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  Your AI companion for mental wellness
                </h1>
                <p className="mt-6 text-xl text-muted-foreground max-w-xl">
                  MindCare combines AI-powered conversations with mood tracking and personalized insights to support your emotional wellbeing.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <Link to="/chat">
                    <Button size="lg" className="gap-2">
                      Start Chatting <MessageSquare className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button size="lg" variant="outline" className="gap-2">
                      Create Account <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
          <div className="flex-1 flex justify-center md:justify-end fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="relative w-full max-w-lg aspect-square">
              <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse-subtle" />
              <div className="absolute inset-4 bg-primary/15 rounded-full animate-pulse-subtle" style={{ animationDelay: '1s' }} />
              <div className="absolute inset-8 bg-primary/20 rounded-full animate-pulse-subtle" style={{ animationDelay: '2s' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Brain className="h-32 w-32 text-primary animate-float" />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 bg-secondary/50 border-y border-border">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How MindCare Helps You</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive approach combines several evidence-based tools to support your mental wellbeing journey.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <MessageSquare className="h-8 w-8 text-primary" />,
                title: "AI Conversations",
                description: "Chat with our empathetic AI assistant who listens without judgment and provides supportive guidance.",
                link: "/chat"
              },
              {
                icon: <BookOpen className="h-8 w-8 text-primary" />,
                title: "Mood Journal",
                description: "Track your emotions daily with our interactive journal to identify patterns and triggers.",
                link: "/journal"
              },
              {
                icon: <BarChart4 className="h-8 w-8 text-primary" />,
                title: "Emotional Insights",
                description: "Receive personalized analytics and suggestions based on your mood patterns and journal entries.",
                link: "/insights"
              },
            ].map((feature, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-all card-hover">
                <div className="mb-4 p-3 rounded-full bg-primary/10 inline-block">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground mb-4">{feature.description}</p>
                <Link to={feature.link} className="text-primary flex items-center font-medium hover:underline">
                  Explore <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* How it Works Section */}
      <section className="py-16 px-4">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              MindCare's approach is designed to be simple, effective, and integrated into your daily routine.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[
              {
                number: "01",
                title: "Chat Daily",
                description: "Have regular conversations with our AI to express your thoughts, feelings, and concerns in a safe space.",
                icon: <MessageSquare className="h-6 w-6" />
              },
              {
                number: "02",
                title: "Track Your Moods",
                description: "Log your emotions in the journal with context to create a detailed record of your mental health journey.",
                icon: <BookOpen className="h-6 w-6" />
              },
              {
                number: "03",
                title: "Gain Insights",
                description: "Review your personalized analytics and receive actionable recommendations to improve your wellbeing.",
                icon: <BarChart4 className="h-6 w-6" />
              }
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center p-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl mb-4">
                  {step.number}
                </div>
                <div className="flex items-center gap-2 mb-3">
                  {step.icon}
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                </div>
                <p className="text-muted-foreground">{step.description}</p>
                {i < 2 && (
                  <div className="hidden lg:block mt-8 border-t border-dashed border-border w-full"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Benefits Section */}
      <section className="py-16 bg-secondary/50 border-y border-border">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose MindCare</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform is designed with your wellbeing and privacy as our highest priorities.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Shield className="h-6 w-6 text-primary" />,
                title: "Privacy-focused",
                description: "Your data is encrypted and handled with the utmost care and confidentiality."
              },
              {
                icon: <Clock className="h-6 w-6 text-primary" />,
                title: "Always Available",
                description: "Access support any time of day, whenever you need someone to talk to."
              },
              {
                icon: <Zap className="h-6 w-6 text-primary" />,
                title: "Personalized",
                description: "Receive customized insights and recommendations tailored to your unique needs."
              },
              {
                icon: <Brain className="h-6 w-6 text-primary" />,
                title: "Evidence-based",
                description: "Our approach is grounded in cognitive behavioral therapy and MindCareness practices."
              }
            ].map((benefit, i) => (
              <div key={i} className="flex flex-col items-center text-center p-4">
                <div className="p-3 rounded-full bg-primary/10 mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section - show different CTAs based on login status */}
      <section className="py-16 px-4">
        <div className="container-custom">
          <div className="bg-card border border-border rounded-xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-lg">
              {user ? (
                <>
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">Continue your wellness journey</h2>
                  <p className="text-muted-foreground mb-6">
                    Your mental health matters. Take a moment today to check in with yourself and track your progress.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link to="/journal">
                      <Button className="gap-2">
                        Journal Today <BookOpen className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link to="/insights">
                      <Button variant="outline" className="gap-2">
                        View Insights <BarChart4 className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to start your wellness journey?</h2>
                  <p className="text-muted-foreground mb-6">
                    Join thousands of users who are improving their mental wellbeing with MindCare's AI-powered support system.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link to="/register">
                      <Button className="gap-2">
                        Get Started <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link to="/chat">
                      <Button variant="outline" className="gap-2" onClick={showLoginNotice}>
                        Try Without Account <MessageSquare className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </div>
            <div className="bg-primary/10 p-8 rounded-full">
              <Brain className="h-24 w-24 text-primary" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
