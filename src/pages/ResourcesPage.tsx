
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ExternalLink, BookOpen, Video, Headphones, PhoneCall } from "lucide-react";

const ResourcesPage = () => {
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
            {[
              {
                title: "Understanding Anxiety",
                description: "Learn about anxiety causes and symptoms",
                content: "This comprehensive guide explains the biological and psychological roots of anxiety disorders, common symptoms, and when to seek professional help.",
                link: "https://www.mayoclinic.org/diseases-conditions/anxiety/symptoms-causes/syc-20350961"
              },
              {
                title: "MoodIntelness Basics",
                description: "An introduction to MoodIntelness practice",
                content: "Discover how MoodIntelness can help you become more aware of your thoughts and feelings, and develop healthier responses to stress.",
                link: "https://www.MoodIntel.org/what-is-MoodIntelness/"
              },
              {
                title: "The Science of Happiness",
                description: "Research-backed ways to feel happier",
                content: "Explore what scientific research tells us about what truly makes people happy, and how you can apply these insights in your daily life.",
                link: "https://www.psychologytoday.com/us/blog/the-science-happiness"
              },
              {
                title: "Building Resilience",
                description: "Strategies to bounce back from challenges",
                content: "Learn practical techniques for developing emotional resilience and navigating life's difficulties with greater strength and perspective.",
                link: "https://www.apa.org/topics/resilience"
              },
              {
                title: "Improving Sleep Quality",
                description: "Tips for better rest and recovery",
                content: "Discover evidence-based strategies for improving your sleep quality, an essential foundation for good mental health.",
                link: "https://www.sleepfoundation.org/sleep-hygiene"
              },
              {
                title: "Managing Work Stress",
                description: "Balancing productivity and wellbeing",
                content: "Find practical approaches to manage workplace stress while maintaining performance and protecting your mental health.",
                link: "https://www.helpguide.org/articles/stress/stress-in-the-workplace.htm"
              },
            ].map((item, i) => (
              <Card key={i} className="card-hover">
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
        </TabsContent>
        
        <TabsContent value="exercises">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: "5-Minute Breathing Exercise",
                description: "Quick relaxation through focused breathing",
                content: "This simple breathing technique can help calm your nervous system quickly. Find a comfortable position, close your eyes, and follow the guided instructions.",
                duration: "5 minutes",
                link: "https://www.verywellmind.com/abdominal-breathing-2584115"
              },
              {
                title: "Body Scan Meditation",
                description: "Reduce physical tension and anxiety",
                content: "A body scan meditation helps bring awareness to different parts of your body, releasing tension and promoting relaxation. Perfect for before bed or during a stressful day.",
                duration: "15 minutes",
                link: "https://www.MoodIntel.org/body-scan-meditation/"
              },
              {
                title: "Loving-kindness Meditation",
                description: "Cultivate compassion toward self and others",
                content: "This meditation focuses on developing feelings of goodwill, kindness, and warmth towards yourself and progressively towards others.",
                duration: "10 minutes",
                link: "https://www.greatergood.berkeley.edu/article/item/how_to_practice_loving_kindness_meditation"
              },
              {
                title: "Progressive Muscle Relaxation",
                description: "Release physical tension systematically",
                content: "Learn to recognize and release physical tension by systematically tensing and relaxing different muscle groups throughout your body.",
                duration: "12 minutes",
                link: "https://www.anxietycanada.com/resources/progressive-muscle-relaxation/"
              },
            ].map((item, i) => (
              <Card key={i} className="card-hover">
                <CardHeader>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <Headphones className="h-4 w-4 text-primary" />
                      <CardDescription>Exercise</CardDescription>
                    </div>
                    <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full">
                      {item.duration}
                    </span>
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>{item.content}</p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" asChild>
                    <a href={item.link} target="_blank" rel="noopener noreferrer">
                      Start Exercise
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="media">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "The Power of Vulnerability",
                description: "TED Talk by Brené Brown",
                type: "Video",
                duration: "20 minutes",
                thumbnail: "https://source.unsplash.com/featured/?speech",
                link: "https://www.ted.com/talks/brene_brown_the_power_of_vulnerability"
              },
              {
                title: "Managing Stress and Anxiety",
                description: "Expert panel discussion",
                type: "Podcast",
                duration: "45 minutes",
                thumbnail: "https://source.unsplash.com/featured/?podcast",
                link: "https://www.psychologytoday.com/us/podcasts/psychology-today-podcast"
              },
              {
                title: "MoodIntelness for Beginners",
                description: "Guided meditation series",
                type: "Audio Course",
                duration: "5 sessions",
                thumbnail: "https://source.unsplash.com/featured/?meditation",
                link: "https://www.headspace.com/meditation/meditation-for-beginners"
              },
              {
                title: "Rewiring Negative Thoughts",
                description: "Cognitive behavioral therapy techniques",
                type: "Video Course",
                duration: "6 videos",
                thumbnail: "https://source.unsplash.com/featured/?psychology",
                link: "https://www.anxietycanada.com/resources/cbt-strategies/"
              },
              {
                title: "Sleep Well Tonight",
                description: "Bedtime relaxation audio",
                type: "Audio",
                duration: "30 minutes",
                thumbnail: "https://source.unsplash.com/featured/?sleep",
                link: "https://www.calm.com/sleep"
              },
              {
                title: "The Happiness Lab",
                description: "Science-based podcast series",
                type: "Podcast",
                duration: "Multiple episodes",
                thumbnail: "https://source.unsplash.com/featured/?happy",
                link: "https://www.happinesslab.fm/"
              },
            ].map((item, i) => (
              <Card key={i} className="overflow-hidden card-hover">
                <div className="aspect-video w-full bg-secondary relative overflow-hidden">
                  <img 
                    src={item.thumbnail} 
                    alt={item.title} 
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    {item.type === "Video" || item.type === "Video Course" ? (
                      <Video className="h-12 w-12 text-white" />
                    ) : (
                      <Headphones className="h-12 w-12 text-white" />
                    )}
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {item.duration}
                  </div>
                </div>
                <CardHeader>
                  <div className="flex items-center space-x-2 mb-1">
                    {item.type === "Video" || item.type === "Video Course" ? (
                      <Video className="h-4 w-4 text-primary" />
                    ) : (
                      <Headphones className="h-4 w-4 text-primary" />
                    )}
                    <CardDescription>{item.type}</CardDescription>
                  </div>
                  <CardTitle className="line-clamp-1">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <a href={item.link} target="_blank" rel="noopener noreferrer">
                      Watch Now <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
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
                  <p>The International Association for Suicide Prevention (IASP) is dedicated to preventing suicidal behavior, alleviating its effects, and providing a forum for academics, professionals, crisis workers, volunteers and suicide survivors.</p>
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
                  <p>Connect with the Veterans Crisis Line to reach caring, qualified responders with the Department of Veterans Affairs. Many of them are Veterans themselves.</p>
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
