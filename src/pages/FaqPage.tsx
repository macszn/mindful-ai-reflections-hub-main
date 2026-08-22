import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQS = [
  {
    q: 'What is Mindful?',
    a: 'Mindful is an AI companion for mental wellness. You can chat for practical guidance, keep a mood journal, complete wellness exercises, and see insights such as your progress score and weekly reports.',
  },
  {
    q: 'Is Mindful a replacement for therapy?',
    a: 'No. Mindful offers supportive guidance and self-help tools. It is not a substitute for professional mental health care, diagnosis, or emergency services. If you are in crisis, contact local emergency services or a crisis line immediately.',
  },
  {
    q: 'How do I create an account?',
    a: 'You can sign up with your name, email, and password, then verify your email. You can also choose Continue with Google to sign up or log in with your Gmail account in one step.',
  },
  {
    q: 'How does Continue with Google work?',
    a: 'Google confirms your email, then Mindful creates an account or signs you into an existing one with that Gmail address. Google sign-in accounts are treated as verified, so you do not need a separate verification email.',
  },
  {
    q: 'I already have a password account. Can I still use Google?',
    a: 'Yes. If you sign in with Google using the same email, Mindful links Google to that account so you can use either method next time.',
  },
  {
    q: 'What does the chatbot help with?',
    a: 'The chatbot is built for practical support: relationships, stress, habits, communication, and everyday wellbeing. It listens, then suggests concrete next steps. Conversation memory is used mainly when you refer back to something you discussed before.',
  },
  {
    q: 'How does the mood journal work?',
    a: 'On the Journal page you log how you feel and optional notes. Those entries feed your Insights charts, wellness score, streak, and weekly report.',
  },
  {
    q: 'What is the Mental Wellness Progress Score?',
    a: 'Insights calculates a 0–100 score from your recent journals, conversation tone, completed exercises, and emotional trends. Open Insights after new activity to see the updated score.',
  },
  {
    q: 'How do weekly reports work?',
    a: 'The Insights weekly report refreshes for the current Monday–Sunday week whenever you open Insights. On Monday at 8:00 AM a popup summarizes last week. If you miss it, open Weekly Report History on Insights.',
  },
  {
    q: 'How do notifications work?',
    a: 'After you enable device notifications on Insights, Mindful can send the Home quote of the day, your current Insights progress score, streak reminders, and weekly report alerts. You can test each type from the same card.',
  },
  {
    q: 'How do I keep my journal streak?',
    a: 'Log a mood journal entry each day. If you have an active streak and have not journaled yet, you may get a reminder in the evening so you can keep it going.',
  },
  {
    q: 'Is my data private?',
    a: 'Journal entries, chats, and insights are stored for your account so the app can personalize support. We do not sell your personal data. See the Privacy Policy for details.',
  },
  {
    q: 'What if I am in crisis?',
    a: 'If you mention self-harm or suicide, Mindful prioritizes safety information and crisis resources. Please also reach out to local emergency services or a trusted person right away.',
  },
];

const FaqPage = () => {
  return (
    <div className="container-custom py-16">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
        <h1 className="text-4xl font-bold mb-3">Frequently Asked Questions</h1>
        <p className="text-muted-foreground mb-10">
          Answers about accounts, Google sign-in, journaling, insights, and getting support on Mindful.
        </p>

        <Accordion type="single" collapsible className="bg-card border border-border rounded-xl px-6">
          {FAQS.map((item, i) => (
            <AccordionItem key={item.q} value={`item-${i}`}>
              <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <p className="text-sm text-muted-foreground mt-8">
          Still need help? Email{' '}
          <a className="text-primary hover:underline" href="mailto:mindfuldevsupport@gmail.com">
            mindfuldevsupport@gmail.com
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default FaqPage;
