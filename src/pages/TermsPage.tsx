import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { TERMS_SECTIONS } from '@/content/legal';

const TermsPage = () => {
  return (
    <div className="container-custom py-16">
      <div className="max-w-4xl mx-auto bg-card border border-border rounded-3xl p-10 shadow-sm">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </div>
        <h1 className="text-4xl font-bold mb-6">Terms of Service</h1>
        <p className="text-muted-foreground mb-6">
          These terms govern your use of Mindful. Please read them carefully before using the application.
        </p>
        <section className="space-y-6">
          {TERMS_SECTIONS.map((section) => (
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

export default TermsPage;
