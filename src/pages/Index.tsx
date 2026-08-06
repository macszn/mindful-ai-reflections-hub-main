import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Brain, ArrowRight, Shield, Clock, Zap, MessageSquare, BookOpen, BarChart4 } from 'lucide-react';
import guidanceImg from '@/assets/guidance.jpg';
import journalImg from '@/assets/journal.jpg';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { getRandomQuote } from '@/utils/quotes';

const QUOTE_STORAGE_KEY = 'Mindful_quote_of_the_day';
const QUOTE_TIMESTAMP_KEY = 'Mindful_quote_timestamp';

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

const FEATURES = [
  {
    image: guidanceImg,
    alt: 'Supportive conversation between two people',
    title: 'Guidance That Helps',
    description:
      'Get empathetic, practical advice for relationships, conflict, anxiety, and life decisions — with clear steps you can try today.',
    link: '/chat',
  },
  {
    image: journalImg,
    alt: 'Person writing in a journal',
    title: 'Mood Journal',
    description:
      'Track how you feel over time, spot patterns, and build self-awareness alongside your conversations.',
    link: '/journal',
  },
  {
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
    alt: 'Wellness analytics dashboard on a screen',
    title: 'Emotional Insights',
    description:
      'Weekly reports, mood trends, and personalized recommendations based on your journal and activity.',
    link: '/insights',
  },
];

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
                  Mindful helps you work through real-life challenges — relationships, stress, and tough decisions — with supportive guidance and tools to track your wellbeing.
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
            <h2 className="text-3xl font-bold mb-4">How Mindful Helps You</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Practical support for the moments that matter — grounded in empathy, clarity, and evidence-informed wellbeing tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all card-hover flex flex-col"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={feature.image}
                    alt={feature.alt}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground mb-4 flex-1">{feature.description}</p>
                  <Link
                    to={feature.link}
                    className="text-primary flex items-center font-medium hover:underline mt-auto"
                  >
                    Explore <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-secondary/50 border-y border-border">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Mindful</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform is designed with your wellbeing and privacy as our highest priorities.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Shield className="h-6 w-6 text-primary" />,
                title: 'Privacy-focused',
                description: 'Your data is encrypted and handled with the utmost care and confidentiality.',
              },
              {
                icon: <Clock className="h-6 w-6 text-primary" />,
                title: 'Always Available',
                description: 'Access support any time of day, whenever you need someone to talk to.',
              },
              {
                icon: <Zap className="h-6 w-6 text-primary" />,
                title: 'Action-oriented',
                description: 'Get concrete ideas and next steps — not just sympathy — for what you are facing.',
              },
              {
                icon: <Brain className="h-6 w-6 text-primary" />,
                title: 'Evidence-based',
                description: 'Grounded in cognitive behavioral therapy and mindfulness practices.',
              },
            ].map((benefit) => (
              <div key={benefit.title} className="flex flex-col items-center text-center p-4">
                <div className="p-3 rounded-full bg-primary/10 mb-4">{benefit.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
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
                    Join users improving their mental wellbeing with Mindful&apos;s supportive guidance and tracking tools.
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
