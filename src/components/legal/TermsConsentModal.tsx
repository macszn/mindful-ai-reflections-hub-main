import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  acceptLegalConsent,
  hasAcceptedLegalConsent,
  PRIVACY_SECTIONS,
  TERMS_SECTIONS,
} from '@/content/legal';

const LEGAL_PATHS = new Set(['/terms', '/privacy']);

const TermsConsentModal = () => {
  const location = useLocation();
  const [accepted, setAccepted] = useState(hasAcceptedLegalConsent);
  const [agreed, setAgreed] = useState(false);

  const readingFullPolicy = LEGAL_PATHS.has(location.pathname);
  const open = !accepted && !readingFullPolicy;

  const handleAccept = () => {
    if (!agreed) return;
    acceptLegalConsent();
    setAccepted(true);
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent
        className="max-w-2xl max-h-[90vh] grid-rows-[auto_1fr_auto]"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Terms &amp; Conditions and Privacy Policy</AlertDialogTitle>
          <AlertDialogDescription>
            Please review and accept these terms before using Mindful. You can also open the full{' '}
            <Link to="/terms" className="text-primary underline-offset-4 hover:underline">
              Terms of Service
            </Link>{' '}
            or{' '}
            <Link to="/privacy" className="text-primary underline-offset-4 hover:underline">
              Privacy Policy
            </Link>
            .
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Tabs defaultValue="terms" className="min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="terms">Terms &amp; Conditions</TabsTrigger>
            <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
          </TabsList>
          <TabsContent value="terms" className="mt-3">
            <ScrollArea className="h-[38vh] rounded-md border border-border p-4">
              <div className="space-y-4 pr-3">
                {TERMS_SECTIONS.map((section) => (
                  <div key={section.title}>
                    <h3 className="font-semibold mb-1">{section.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{section.body}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="privacy" className="mt-3">
            <ScrollArea className="h-[38vh] rounded-md border border-border p-4">
              <div className="space-y-4 pr-3">
                {PRIVACY_SECTIONS.map((section) => (
                  <div key={section.title}>
                    <h3 className="font-semibold mb-1">{section.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{section.body}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <AlertDialogFooter className="flex-col sm:flex-col gap-4 sm:space-x-0">
          <div className="flex items-start space-x-2 w-full">
            <Checkbox
              id="legal-consent"
              checked={agreed}
              onCheckedChange={(value) => setAgreed(value === true)}
            />
            <Label htmlFor="legal-consent" className="text-sm font-medium leading-snug">
              I have read and agree to the Terms &amp; Conditions and Privacy Policy.
            </Label>
          </div>
          <AlertDialogAction
            className="w-full sm:w-auto self-end"
            disabled={!agreed}
            onClick={handleAccept}
          >
            I agree, continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default TermsConsentModal;
