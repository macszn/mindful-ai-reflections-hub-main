import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ExternalLink, BookOpen, Video, Headphones, PhoneCall, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { getApiBase, getStoredUser } from "@/utils/api";

const ITEMS_PER_PAGE = 6;

type ArticleItem = {
  title: string;
  description: string;
  content: string;
  link: string;
};

type ExerciseItem = {
  title: string;
  description: string;
  content: string;
  duration: string;
  /** YouTube watch or youtu.be URL */
  videoUrl: string;
};

function youtubeVideoId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").slice(0, 11);
      return /^[\w-]{11}$/.test(id) ? id : null;
    }
    if (u.hostname === "www.youtube.com" || u.hostname === "youtube.com" || u.hostname === "m.youtube.com") {
      if (u.pathname === "/watch" || u.pathname.startsWith("/watch")) {
        const v = u.searchParams.get("v");
        return v && /^[\w-]{11}$/.test(v) ? v : null;
      }
      const embed = u.pathname.match(/^\/embed\/([\w-]{11})/);
      if (embed) return embed[1];
    }
  } catch {
    return null;
  }
  return null;
}

function youtubeThumbnailFromUrl(videoUrl: string): string | null {
  const id = youtubeVideoId(videoUrl);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

type MediaItem = {
  title: string;
  description: string;
  type: string;
  duration: string;
  /** YouTube watch or youtu.be URL */
  videoUrl: string;
};

const ARTICLES: ArticleItem[] = [
  {
    title: "Understanding Anxiety",
    description: "Learn about anxiety causes and symptoms",
    content: "This comprehensive guide explains the biological and psychological roots of anxiety disorders, common symptoms, and when to seek professional help.",
    link: "https://www.mayoclinic.org/diseases-conditions/anxiety/symptoms-causes/syc-20350961",
  },
  {
    title: "Mindfulness Basics",
    description: "An introduction to Mindfulness practice",
    content: "Discover how Mindfulness can help you become more aware of your thoughts and feelings, and develop healthier responses to stress.",
    link: "https://www.Mindful.org/what-is-Mindfulness/",
  },
  {
    title: "The Science of Happiness",
    description: "Research-backed ways to feel happier",
    content: "Explore what scientific research tells us about what truly makes people happy, and how you can apply these insights in your daily life.",
    link: "https://www.psychologytoday.com/us/blog/the-science-happiness",
  },
  {
    title: "Building Resilience",
    description: "Strategies to bounce back from challenges",
    content: "Learn practical techniques for developing emotional resilience and navigating life's difficulties with greater strength and perspective.",
    link: "https://www.apa.org/topics/resilience",
  },
  {
    title: "Improving Sleep Quality",
    description: "Tips for better rest and recovery",
    content: "Discover evidence-based strategies for improving your sleep quality, an essential foundation for good mental health.",
    link: "https://www.sleepfoundation.org/sleep-hygiene",
  },
  {
    title: "Managing Work Stress",
    description: "Balancing productivity and wellbeing",
    content: "Find practical approaches to manage workplace stress while maintaining performance and protecting your mental health.",
    link: "https://www.helpguide.org/articles/stress/stress-in-the-workplace.htm",
  },
  {
    title: "Understanding Depression",
    description: "Signs, symptoms, and treatment options",
    content: "A clear overview of major depression, how it differs from ordinary sadness, and pathways to effective treatment and support.",
    link: "https://www.nimh.nih.gov/health/topics/depression",
  },
  {
    title: "Social Connection and Health",
    description: "Why relationships matter for wellbeing",
    content: "Research shows strong social ties can buffer stress and support recovery. Learn how to nurture meaningful connection in everyday life.",
    link: "https://www.cdc.gov/emotional-wellbeing/social-connectedness/index.htm",
  },
  {
    title: "Movement and Mental Health",
    description: "How physical activity supports mood",
    content: "Regular movement can ease anxiety and low mood. This article summarizes what works and how to start sustainably.",
    link: "https://www.mayoclinic.org/diseases-conditions/depression/in-depth/depression-and-exercise/art-20046495",
  },
  {
    title: "Nutrition and Mood",
    description: "Food patterns that support stability",
    content: "Explore how balanced meals, hydration, and Mindful eating habits can complement therapy and medication when needed.",
    link: "https://www.apa.org/topics/behavioral-health/nutrition",
  },
  {
    title: "Grounding for Overwhelm",
    description: "Simple techniques when emotions spike",
    content: "Grounding skills help you stay present during panic or dissociation. Practice short exercises you can use anywhere.",
    link: "https://www.anxietycanada.com/articles/how-to-do-grounding-exercises/",
  },
  {
    title: "Grief and Loss",
    description: "Honoring change while coping",
    content: "Grief is a natural response to loss. Learn about common patterns, self-compassion, and when professional grief counseling helps.",
    link: "https://www.apa.org/topics/grief",
  },
  {
    title: "Trauma-Informed Self-Care",
    description: "Safety and pacing after difficult events",
    content: "Trauma-informed approaches emphasize choice, predictability, and gentle routines. Read principles you can apply with a clinician's guidance.",
    link: "https://www.samhsa.gov/trauma-violence/trauma-informed-care",
  },
  {
    title: "Setting Healthy Boundaries",
    description: "Protect your energy without guilt",
    content: "Boundaries clarify what you need from others. Scripts and examples make it easier to communicate limits with respect.",
    link: "https://www.psychologytoday.com/us/basics/boundaries",
  },
  {
    title: "Understanding Panic Attacks",
    description: "What happens in the body and mind",
    content: "Panic attacks feel intense but are treatable. Learn the cycle of fear, breathing myths vs facts, and evidence-based treatments.",
    link: "https://www.anxietycanada.com/articles/panic-disorder/",
  },
  {
    title: "Cognitive Distortions",
    description: "Common thinking traps and reframes",
    content: "CBT identifies patterns like catastrophizing or black-and-white thinking. Spotting them is the first step toward more balanced thoughts.",
    link: "https://www.verywellmind.com/cognitive-distortions-2795423",
  },
  {
    title: "Supporting a Loved One",
    description: "What helps—and what to avoid",
    content: "Practical guidance for listening without fixing, encouraging professional help, and caring for your own limits while supporting someone in distress.",
    link: "https://www.mentalhealth.org.uk/explore-mental-health/a-z-topics/supporting-someone-else-s-mental-health",
  },
  {
    title: "Finding the Right Therapist",
    description: "Types of therapy and questions to ask",
    content: "Compare approaches like CBT, DBT, and psychodynamic therapy, and learn how to interview a therapist to find a good fit.",
    link: "https://www.apa.org/topics/psychotherapy/understanding",
  },
];

const EXERCISES: ExerciseItem[] = [
  {
    title: "5-Minute Breathing Exercise",
    description: "Quick relaxation through focused breathing",
    content: "This simple breathing technique can help calm your nervous system quickly. Find a comfortable position, close your eyes, and follow the guided instructions.",
    duration: "5 min",
    videoUrl: "https://www.youtube.com/watch?v=pS-7gqniJ6Q",
  },
  {
    title: "Body Scan Meditation",
    description: "Reduce physical tension and anxiety",
    content: "A body scan meditation helps bring awareness to different parts of your body, releasing tension and promoting relaxation. Perfect for before bed or during a stressful day.",
    duration: "15 min",
    videoUrl: "https://www.youtube.com/watch?v=X8dWBIIcEjA",
  },
  {
    title: "Loving-kindness Meditation",
    description: "Cultivate compassion toward self and others",
    content: "This meditation focuses on developing feelings of goodwill, kindness, and warmth towards yourself and progressively towards others.",
    duration: "21 min",
    videoUrl: "https://www.youtube.com/watch?v=9cxtdiXBQDk",
  },
  {
    title: "Progressive Muscle Relaxation",
    description: "Release physical tension systematically",
    content: "Learn to recognize and release physical tension by systematically tensing and relaxing different muscle groups throughout your body.",
    duration: "10 min",
    videoUrl: "https://www.youtube.com/watch?v=2IJUD-e14FY",
  },
  {
    title: "54321 Grounding",
    description: "Orient to the present using your senses",
    content: "Name five things you see, four you feel, three you hear, two you smell, and one you taste to anchor attention in the here-and-now.",
    duration: "6 min",
    videoUrl: "https://www.youtube.com/watch?v=BsEn5_BOK-s",
  },
  {
    title: "Box Breathing",
    description: "Even inhale, hold, exhale, hold",
    content: "Used by performers and clinicians alike, box breathing regulates the breath in four equal counts to steady heart rate and focus.",
    duration: "7 min",
    videoUrl: "https://www.youtube.com/watch?v=oq5pZ7dpUDc",
  },
  {
    title: "Mindful Walking",
    description: "Slow steps with attention on contact",
    content: "Walk indoors or outdoors at a gentle pace, noticing heel-to-toe motion, balance, and the rhythm of movement without a goal.",
    duration: "9 min",
    videoUrl: "https://www.youtube.com/watch?v=Bc2JGFWR47c",
  },
  {
    title: "Self-Compassion Break",
    description: "Three phrases from Kristin Neff's work",
    content: "Acknowledge suffering, remember our common humanity, and offer yourself kindness with a short phrase-based practice.",
    duration: "5 min",
    videoUrl: "https://www.youtube.com/watch?v=N25KR01h5jI",
  },
  {
    title: "Visualization for Calm",
    description: "A safe place in imagination",
    content: "Picture a setting where you feel at ease—light, sounds, temperature—and rest there mentally while breathing slowly.",
    duration: "15 min",
    videoUrl: "https://www.youtube.com/watch?v=ifZDOp6V3xc",
  },
  {
    title: "Jaw and Shoulder Release",
    description: "Micro-movements for desk tension",
    content: "Gentle rolls, stretches, and unclenching exercises for areas that hold stress during focused work or worry.",
    duration: "8 min",
    videoUrl: "https://www.youtube.com/watch?v=s-7lyvblFKI",
  },
  {
    title: "Sleep Wind-Down",
    description: "Transition from screen time to rest",
    content: "Dim lights, slow breathing, and a gratitude note help signal the body that it is safe to sleep.",
    duration: "10 min",
    videoUrl: "https://www.youtube.com/watch?v=rvaJea9JljY",
  },
  {
    title: "Urge Surfing",
    description: "Ride waves of craving or anxiety",
    content: "Notice urges rise and fall like waves without acting immediately, building tolerance for uncomfortable feelings.",
    duration: "6 min",
    videoUrl: "https://www.youtube.com/watch?v=dZS2sS0dZO8",
  },
  {
    title: "Gratitude Journaling Prompt",
    description: "Three specifics from today",
    content: "Write three concrete moments you appreciated—even small ones—to shift attention toward what went okay.",
    duration: "10 min",
    videoUrl: "https://www.youtube.com/watch?v=CJLSNNZ28AY",
  },
  {
    title: "Compassionate Letter to Self",
    description: "Write as you would to a friend",
    content: "Address yourself with warmth about a current struggle, then read it slowly and notice any shifts in tone in your body.",
    duration: "19 min",
    videoUrl: "https://www.youtube.com/watch?v=NRo2XVxmkE0",
  },
  {
    title: "Energizing Breath Practice",
    description: "Controlled breathing for focus and calm",
    content: "A short guided breath sequence to wake up the body gently—useful when you feel sluggish or scattered.",
    duration: "11 min",
    videoUrl: "https://www.youtube.com/watch?v=tybOi4huZzQ",
  },
  {
    title: "Mindful Eating Snack",
    description: "One bite with full attention",
    content: "Choose a small food item, observe texture and taste, chew slowly, and pause between bites to notice fullness cues.",
    duration: "13 min",
    videoUrl: "https://www.youtube.com/watch?v=hgo487kfZRs",
  },
  {
    title: "Sound Bath Listening",
    description: "Passive attention to ambient audio",
    content: "Play neutral nature or instrumental sounds; when attention wanders, gently return to layers of the soundscape.",
    duration: "15 min",
    videoUrl: "https://www.youtube.com/watch?v=1ZYbUoeG2Tc",
  },
  {
    title: "Values Clarification",
    description: "Rank what matters this week",
    content: "List domains like health, relationships, growth; pick one small action aligned with your top value for the next seven days.",
    duration: "12 min",
    videoUrl: "https://www.youtube.com/watch?v=Ba82FaNncGw",
  },
];

const MEDIA: MediaItem[] = [
  {
    title: "The Power of Vulnerability",
    description: "TED Talk by Brené Brown",
    type: "Video",
    duration: "21 min",
    videoUrl: "https://www.youtube.com/watch?v=iCvmsMzlF7o",
  },
  {
    title: "Managing Stress and Anxiety",
    description: "How anxiety works and what helps",
    type: "Video",
    duration: "8 min",
    videoUrl: "https://www.youtube.com/watch?v=WWloIAQp35k",
  },
  {
    title: "Mindfulness for Beginners",
    description: "Short guided meditation",
    type: "Video",
    duration: "10 min",
    videoUrl: "https://www.youtube.com/watch?v=inpok4MKVLM",
  },
  {
    title: "Rewiring Negative Thoughts",
    description: "Understanding cognitive distortions",
    type: "Video",
    duration: "6 min",
    videoUrl: "https://www.youtube.com/watch?v=otFrNM7PnME",
  },
  {
    title: "Sleep Well Tonight",
    description: "Guided relaxation for rest",
    type: "Video",
    duration: "15 min",
    videoUrl: "https://www.youtube.com/watch?v=aEqlQSSC7Uk",
  },
  {
    title: "The Happiness Lab",
    description: "Science-based happiness with Dr. Laurie Santos",
    type: "Podcast",
    duration: "38 min",
    videoUrl: "https://www.youtube.com/watch?v=pLZ79zektgM",
  },
  {
    title: "Inside Mental Health",
    description: "Living with bipolar disorder — conversation with Gabe Howard",
    type: "Podcast",
    duration: "52 min",
    videoUrl: "https://www.youtube.com/watch?v=bH7UwWUOv38",
  },
  {
    title: "Yoga for Anxiety",
    description: "Gentle movement with breath cues",
    type: "Video",
    duration: "20 min",
    videoUrl: "https://www.youtube.com/watch?v=ZToicYcHIOU",
  },
  {
    title: "Nature Soundscapes",
    description: "Forest stream ambience for focus or rest",
    type: "Video",
    duration: "3 hr",
    videoUrl: "https://www.youtube.com/watch?v=DeumyOzKrgI",
  },
  {
    title: "CBT Explained",
    description: "What cognitive behavioral therapy is",
    type: "Video",
    duration: "6 min",
    videoUrl: "https://www.youtube.com/watch?v=6wcjkAF_IhQ",
  },
  {
    title: "Therapy for Black Girls",
    description: "Community and mental health topics",
    type: "Podcast",
    duration: "52 min",
    videoUrl: "https://www.youtube.com/watch?v=XfgDhYDuu6w",
  },
  {
    title: "Breathwork Basics",
    description: "4-7-8 breathing guided practice",
    type: "Video",
    duration: "5 min",
    videoUrl: "https://www.youtube.com/watch?v=RGjjmnKM__E",
  },
  {
    title: "The Mindful Kind",
    description: "Practical Mindfulness ideas for busy days",
    type: "Video",
    duration: "8 min",
    videoUrl: "https://www.youtube.com/watch?v=Rub-JsjMhWY",
  },
  {
    title: "DBT Skills Intro",
    description: "Overview of dialectical behavior therapy skills",
    type: "Video",
    duration: "12 min",
    videoUrl: "https://www.youtube.com/watch?v=VcV6nvM9QRU",
  },
  {
    title: "Classical for Concentration",
    description: "Instrumental music for deep work",
    type: "Video",
    duration: "2 hr",
    videoUrl: "https://www.youtube.com/watch?v=4oSTUEhvsDM",
  },
  {
    title: "Mental Health Mini-Docs",
    description: "WHO film: I had a black dog, his name was depression",
    type: "Video",
    duration: "4 min",
    videoUrl: "https://www.youtube.com/watch?v=XiCrniLQGYc",
  },
  {
    title: "Sleep Stories Collection",
    description: "Softly spoken sleep talk-down",
    type: "Video",
    duration: "1 hr",
    videoUrl: "https://www.youtube.com/watch?v=wJOvkHPmfhg",
  },
  {
    title: "Workplace Wellbeing Talks",
    description: "WHO guidance on mental health at work",
    type: "Video",
    duration: "4 min",
    videoUrl: "https://www.youtube.com/watch?v=hnpQrMqIfqE",
  },
];

function ResourceSubTabs({ page, onPageChange, ariaLabel }: { page: number; onPageChange: (p: number) => void; ariaLabel: string }) {
  return (
    <div className="flex justify-center gap-2 mt-8" role="tablist" aria-label={ariaLabel}>
      {[0, 1, 2].map((p) => (
        <button
          key={p}
          type="button"
          role="tab"
          aria-selected={page === p}
          onClick={() => onPageChange(p)}
          className={cn(
            "h-10 w-10 shrink-0 flex items-center justify-center font-serif text-lg tabular-nums transition-colors rounded-none",
            page === p ? "bg-muted text-foreground border border-transparent" : "bg-background border border-border text-foreground hover:bg-muted/50"
          )}
        >
          {p + 1}
        </button>
      ))}
    </div>
  );
}

const ResourcesPage = () => {
  const [articlePage, setArticlePage] = useState(0);
  const [exercisePage, setExercisePage] = useState(0);
  const [mediaPage, setMediaPage] = useState(0);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [markingId, setMarkingId] = useState<string | null>(null);
  const user = getStoredUser();

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      try {
        const res = await fetch(`${getApiBase()}/api/activities/${user.id}`);
        if (!res.ok) return;
        const data = await res.json();
        setCompletedIds(new Set(data.completedIds || []));
      } catch (err) {
        console.error('Failed to load completed activities', err);
      }
    };
    load();
  }, [user?.id]);

  const markComplete = async (activityId: string, activityTitle: string) => {
    if (!user?.id) {
      toast.error('Log in to track completed activities');
      return;
    }
    setMarkingId(activityId);
    try {
      const res = await fetch(`${getApiBase()}/api/activities/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          activityId,
          activityTitle,
          category: 'exercise',
        }),
      });
      if (!res.ok) throw new Error('Failed');
      setCompletedIds((prev) => new Set(prev).add(activityId));
      toast.success('Activity counted toward your wellness score');
    } catch {
      toast.error('Could not mark activity complete');
    } finally {
      setMarkingId(null);
    }
  };

  const articleSlice = ARTICLES.slice(articlePage * ITEMS_PER_PAGE, articlePage * ITEMS_PER_PAGE + ITEMS_PER_PAGE);
  const exerciseSlice = EXERCISES.slice(exercisePage * ITEMS_PER_PAGE, exercisePage * ITEMS_PER_PAGE + ITEMS_PER_PAGE);
  const mediaSlice = MEDIA.slice(mediaPage * ITEMS_PER_PAGE, mediaPage * ITEMS_PER_PAGE + ITEMS_PER_PAGE);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Resource Hub</h1>
        <p className="text-muted-foreground">Curated resources to support your mental wellbeing</p>
      </div>

      <Tabs defaultValue="articles">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="exercises">Exercises</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="crisis">Crisis Help</TabsTrigger>
        </TabsList>

        <TabsContent value="articles">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articleSlice.map((item, i) => (
              <Card key={`${articlePage}-${i}`} className="card-hover">
                <CardHeader>
                  <div className="flex items-center space-x-2 mb-1">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <CardDescription>Article</CardDescription>
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-3">{item.content}</p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <a href={item.link} target="_blank" rel="noopener noreferrer">
                      Read Article <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          <ResourceSubTabs page={articlePage} onPageChange={setArticlePage} ariaLabel="Articles pages" />
        </TabsContent>

        <TabsContent value="exercises">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exerciseSlice.map((item, i) => {
              const thumb = youtubeThumbnailFromUrl(item.videoUrl);
              const activityId = `exercise-${item.title.toLowerCase().replace(/\s+/g, '-')}`;
              const done = completedIds.has(activityId);
              return (
                <Card key={`${exercisePage}-${i}`} className="overflow-hidden card-hover">
                  <div className="aspect-video w-full bg-secondary relative overflow-hidden">
                    {thumb ? (
                      <img src={thumb} alt={item.title} className="object-cover w-full h-full" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        <Video className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <Video className="h-12 w-12 text-white" />
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">{item.duration}</div>
                  </div>
                  <CardHeader>
                    <div className="flex items-center space-x-2 mb-1">
                      <Video className="h-4 w-4 text-primary" />
                      <CardDescription>Guided video</CardDescription>
                    </div>
                    <CardTitle className="line-clamp-2">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-3 text-sm text-muted-foreground">{item.content}</p>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-2">
                    <Button className="w-full" asChild>
                      <a href={item.videoUrl} target="_blank" rel="noopener noreferrer">
                        Watch on YouTube <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant={done ? 'secondary' : 'outline'}
                      className="w-full"
                      disabled={done || markingId === activityId}
                      onClick={() => markComplete(activityId, item.title)}
                    >
                      {done ? (
                        <>
                          <Check className="mr-2 h-4 w-4" /> Completed today
                        </>
                      ) : (
                        'Mark complete'
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
          <ResourceSubTabs page={exercisePage} onPageChange={setExercisePage} ariaLabel="Exercises pages" />
        </TabsContent>

        <TabsContent value="media">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mediaSlice.map((item, i) => {
              const thumb = youtubeThumbnailFromUrl(item.videoUrl);
              const isVideoType = item.type === "Video" || item.type === "Video Course";
              return (
                <Card key={`${mediaPage}-${i}`} className="overflow-hidden card-hover">
                  <div className="aspect-video w-full bg-secondary relative overflow-hidden">
                    {thumb ? (
                      <img src={thumb} alt={item.title} className="object-cover w-full h-full" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        <Video className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      {isVideoType ? (
                        <Video className="h-12 w-12 text-white" />
                      ) : (
                        <Headphones className="h-12 w-12 text-white" />
                      )}
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">{item.duration}</div>
                  </div>
                  <CardHeader>
                    <div className="flex items-center space-x-2 mb-1">
                      {isVideoType ? (
                        <Video className="h-4 w-4 text-primary" />
                      ) : (
                        <Headphones className="h-4 w-4 text-primary" />
                      )}
                      <CardDescription>{item.type}</CardDescription>
                    </div>
                    <CardTitle className="line-clamp-2">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button variant="outline" className="w-full" asChild>
                      <a href={item.videoUrl} target="_blank" rel="noopener noreferrer">
                        Watch on YouTube <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
          <ResourceSubTabs page={mediaPage} onPageChange={setMediaPage} ariaLabel="Media pages" />
        </TabsContent>

        <TabsContent value="crisis">
          <div className="max-w-3xl mx-auto">
            <Card className="mb-6 border-destructive/20 bg-destructive/5">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PhoneCall className="mr-2 h-5 w-5 text-destructive" />
                  If you're in crisis, get help immediately
                </CardTitle>
                <CardDescription>
                  If you're thinking about suicide, are worried about a friend or loved one, or would like emotional support, help is available.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-card border border-border">
                    <h3 className="font-semibold text-lg mb-1">National Suicide Prevention Lifeline</h3>
                    <p className="text-2xl font-bold text-destructive mb-1">+233 244 846 701</p>
                    <p className="text-sm text-muted-foreground">Available 24/7 in Ghana</p>
                  </div>
                  <div className="p-4 rounded-lg bg-card border border-border">
                    <h3 className="font-semibold text-lg mb-1">Crisis Text Line</h3>
                    <p className="text-2xl font-bold text-destructive mb-1">Text HOME to 112</p>
                    <p className="text-sm text-muted-foreground">Text from anywhere in the Ghana, anytime</p>
                  </div>
                </div>
                <p className="text-sm">
                  These services provide free and confidential support for people in distress, prevention and crisis resources for you or your loved ones.
                </p>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="destructive" asChild>
                  <a href="https://suicidepreventionlifeline.org/" target="_blank" rel="noopener noreferrer">
                    Visit National Suicide Prevention Website
                  </a>
                </Button>
              </CardFooter>
            </Card>

            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Additional Resources</h2>
              <Card>
                <CardHeader>
                  <CardTitle>International Association for Suicide Prevention</CardTitle>
                  <CardDescription>Find crisis centers around the world</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    The International Association for Suicide Prevention (IASP) is dedicated to preventing suicidal behavior, alleviating its effects, and providing a forum for academics, professionals, crisis workers, volunteers and suicide survivors.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <a href="https://www.iasp.info/resources/Crisis_Centres/" target="_blank" rel="noopener noreferrer">
                      Find International Resources
                    </a>
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Veterans Crisis Line</CardTitle>
                  <CardDescription>For U.S. Military Veterans and their loved ones</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Connect with the Veterans Crisis Line to reach caring, qualified responders with the Department of Veterans Affairs. Many of them are Veterans themselves.
                  </p>
                  <div className="mt-4">
                    <p className="font-semibold">1-800-273-8255 and Press 1</p>
                    <p className="text-muted-foreground">Or text 838255</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <a href="https://www.veteranscrisisline.net/" target="_blank" rel="noopener noreferrer">
                      Visit Veterans Crisis Line
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResourcesPage;
