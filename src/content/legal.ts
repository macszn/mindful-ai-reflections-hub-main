export const TERMS_SECTIONS = [
  {
    title: 'Acceptance of Terms',
    body: 'By using Mindful, you agree to these Terms of Service. If you do not agree, please do not use the app.',
  },
  {
    title: 'Use of the Service',
    body: 'Mindful is provided for personal, non-commercial use. You agree to use the app responsibly and not to engage in any harmful or abusive behavior.',
  },
  {
    title: 'Account Responsibilities',
    body: 'You are responsible for keeping your account credentials secure. Notify us immediately if you suspect unauthorized use of your account.',
  },
  {
    title: 'Chatbot responses — please double-check',
    body: 'Mindful’s chatbot can make mistakes, miss important context, or give incomplete or outdated information. You agree to independently verify any advice, facts, or suggestions before acting on them. Do not rely on chatbot responses as professional, medical, legal, or emergency guidance. If you are in crisis or need clinical care, contact a qualified professional or local emergency services.',
  },
  {
    title: 'Intellectual Property',
    body: 'All content, design, and technology in Mindful are the property of the service provider. You may not reproduce or redistribute our materials without permission.',
  },
  {
    title: 'Limitation of Liability',
    body: 'Mindful is not a substitute for professional mental health care. We are not liable for any decisions you make based on the information provided within the app, including chatbot responses.',
  },
] as const;

export const PRIVACY_SECTIONS = [
  {
    title: 'Information We Collect',
    body: 'We store your account name and email, mood journal entries, weekly reflection answers, and activity completion records on the app backend. Chat history is stored in this browser; short chat exchanges are also stored on the backend only when you enable Remember my emotional journey. The app uses local storage for sign-in state and chat copies.',
  },
  {
    title: 'How Information Is Used and Shared',
    body: 'The app uses your records to provide the features you choose. Chat messages and the current conversation context are sent to the configured Google Gemini service to generate replies. Only when you turn on Remember my emotional journey may journal and saved chat information be sent to that AI service to create personalized recommendations and emotional weekly reflections. With that setting off, weekly reports show activity counts only. Push notification subscriptions are stored if you enable notifications. Do not include information you would not want processed by these services.',
  },
  {
    title: 'Who Can Access Your Information',
    body: 'Your records are processed by the app backend and configured providers needed to deliver requested features. The app does not provide a clinical service, and these records should not be treated as clinical health records. No system can promise complete security.',
  },
  {
    title: 'Review, Deletion, and Retention',
    body: 'In Insights, you can review and turn off saved emotional memory; turning it off deletes saved memory, server-side chat exchanges used for personalization, generated emotional report content, and stored legacy progress scores. You can delete individual chats in Chat. You can permanently delete your account and associated backend records in Insights. Local chat copies remain in this browser until you delete them individually or delete your account from this browser. Simply stopping use of Mindful does not delete your data. Backend data is retained until you delete it; deletion from live app records does not make claims about provider or infrastructure backups.',
  },
  {
    title: 'Your Choices and Contact',
    body: 'You may use the journal and mood charts without enabling cross-session emotional memory. Turning that setting off disables AI recommendations and personalized weekly emotional reflections. Contact us using the support email listed in the app footer if you have questions about this policy or your information.',
  },
] as const;

export const LEGAL_CONSENT_STORAGE_KEY = 'mindful_legal_consent_v1';

export function hasAcceptedLegalConsent(): boolean {
  try {
    return localStorage.getItem(LEGAL_CONSENT_STORAGE_KEY) === 'accepted';
  } catch {
    return false;
  }
}

export function acceptLegalConsent(): void {
  try {
    localStorage.setItem(LEGAL_CONSENT_STORAGE_KEY, 'accepted');
  } catch {
    /* private browsing or blocked storage — still allow this session */
  }
}
