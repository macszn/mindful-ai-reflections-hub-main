import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PRIVACY_SECTIONS } from '@/content/legal';

const PrivacyPolicyPage = () => {
  return (
    <div className="container-custom py-16">
      <div className="max-w-4xl mx-auto bg-card border border-border rounded-3xl p-10 shadow-sm">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </div>
        <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-muted-foreground mb-6">
          Your privacy is important to us. This policy explains how Mindful collects, uses, and protects your personal data when you use our service.
        </p>
        <section className="space-y-6">
          {PRIVACY_SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="text-2xl font-semibold mb-3">{section.title}</h2>
              <p className="text-foreground/80 leading-relaxed">{section.body}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
