import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicyPage = () => {
  return (
    <div className="container-custom py-16">
      <div className="max-w-4xl mx-auto bg-card border border-border rounded-3xl p-10 shadow-sm">
        <div className="mb-8">
          <Link to="/register" className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sign Up
          </Link>
        </div>
        <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-muted-foreground mb-6">
          Your privacy is important to us. This policy explains how Mindful collects, uses, and protects your personal data when you use our service.
        </p>
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-3">Information We Collect</h2>
            <p className="text-foreground/80 leading-relaxed">
              We may collect information that you provide directly, such as your email address, profile details, and support requests. We also collect usage data to help improve the experience and personalize features.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-3">How We Use Information</h2>
            <p className="text-foreground/80 leading-relaxed">
              We use your information to provide the service, support your account, improve the app, and communicate important updates. We do not sell your personal data to third parties.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-3">Data Security</h2>
            <p className="text-foreground/80 leading-relaxed">
              We use reasonable security measures to protect your data. While no system is completely secure, we work to safeguard your information and restrict access to authorized personnel only.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-3">Cookies and Tracking</h2>
            <p className="text-foreground/80 leading-relaxed">
              We may use cookies and similar technologies to understand how the service is used and to improve performance. You can manage cookies through your browser settings.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-3">Contact</h2>
            <p className="text-foreground/80 leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at the email address listed in the app footer.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
