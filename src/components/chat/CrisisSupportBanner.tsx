import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PhoneCall, AlertTriangle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export type CrisisResource = {
  name: string;
  contact: string;
  description: string;
  type?: string;
};

export type RiskInfo = {
  level: 'none' | 'elevated' | 'high' | 'critical';
  detectedPhrases?: string[];
  labels?: string[];
  requiresCrisisSupport?: boolean;
  crisisResources?: CrisisResource[];
};

type CrisisSupportBannerProps = {
  risk: RiskInfo;
  onDismiss?: () => void;
};

export function CrisisSupportBanner({ risk, onDismiss }: CrisisSupportBannerProps) {
  if (!risk.requiresCrisisSupport && risk.level !== 'high' && risk.level !== 'critical') {
    return null;
  }

  const resources = risk.crisisResources ?? [];
  const isCritical = risk.level === 'critical';

  return (
    <Alert
      variant="destructive"
      className="mb-4 border-destructive/40 bg-destructive/5 text-foreground"
    >
      <AlertTriangle className="h-4 w-4 text-destructive" />
      <AlertTitle className="text-destructive flex items-center gap-2">
        <PhoneCall className="h-4 w-4" />
        {isCritical ? 'Immediate support recommended' : 'We noticed you may be struggling'}
      </AlertTitle>
      <AlertDescription className="space-y-3 text-foreground/90">
        <p>
          {isCritical
            ? 'If you are in danger or thinking about harming yourself, please reach out for help right now. You matter, and trained people are ready to listen.'
            : 'What you shared sounds really painful. You are not alone — crisis support is available if you need someone to talk to.'}
        </p>

        {resources.length > 0 && (
          <ul className="space-y-2 text-sm">
            {resources.map((resource) => (
              <li key={resource.name} className="rounded-md border border-destructive/20 bg-background/80 px-3 py-2">
                <span className="font-medium">{resource.name}</span>
                <span className="block text-destructive font-semibold">{resource.contact}</span>
                <span className="text-muted-foreground">{resource.description}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" variant="destructive" asChild>
            <a href="tel:+233244846701">Call crisis line</a>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to="/resources">More crisis resources</Link>
          </Button>
          <Button size="sm" variant="ghost" asChild>
            <a
              href="https://www.iasp.info/resources/Crisis_Centres/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1"
            >
              International help <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
          {onDismiss && (
            <Button size="sm" variant="ghost" onClick={onDismiss}>
              Dismiss banner
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
