import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsPage = () => {
  return (
    <div className="container-custom py-16">
      <div className="max-w-4xl mx-auto bg-card border border-border rounded-3xl p-10 shadow-sm">
        <div className="mb-8">
          <Link to="/register" className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sign Up
          </Link>
        </div>
        <h1 className="text-4xl font-bold mb-6">Terms of Service</h1>
        <p className="text-muted-foreground mb-6">
          These terms govern your use of Mindful. Please read them carefully before using the application.
        </p>
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-3">Acceptance of Terms</h2>
            <p className="text-foreground/80 leading-relaxed">
              By using Mindful, you agree to these Terms of Service. If you do not agree, please do not use the app.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-3">Use of the Service</h2>
            <p className="text-foreground/80 leading-relaxed">
              Mindful is provided for personal, non-commercial use. You agree to use the app responsibly and not to engage in any harmful or abusive behavior.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-3">Account Responsibilities</h2>
            <p className="text-foreground/80 leading-relaxed">
              You are responsible for keeping your account credentials secure. Notify us immediately if you suspect unauthorized use of your account.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-3">Intellectual Property</h2>
            <p className="text-foreground/80 leading-relaxed">
              All content, design, and technology in Mindful are the property of the service provider. You may not reproduce or redistribute our materials without permission.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-3">Limitation of Liability</h2>
            <p className="text-foreground/80 leading-relaxed">
              Mindful is not a substitute for professional mental health care. We are not liable for any decisions you make based on the information provided within the app.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TermsPage;
