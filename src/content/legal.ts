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
    body: 'We may collect information that you provide directly, such as your email address, profile details, and support requests. We also collect usage data to help improve the experience and personalize features.',
  },
  {
    title: 'How We Use Information',
    body: 'We use your information to provide the service, support your account, improve the app, and communicate important updates. We do not sell your personal data to third parties.',
  },
  {
    title: 'Data Security',
    body: 'We use reasonable security measures to protect your data. While no system is completely secure, we work to safeguard your information and restrict access to authorized personnel only.',
  },
  {
    title: 'Cookies and Tracking',
    body: 'We may use cookies and similar technologies to understand how the service is used and to improve performance. You can manage cookies through your browser settings.',
  },
  {
    title: 'Contact',
    body: 'If you have questions about this Privacy Policy, please contact us at the email address listed in the app footer.',
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
