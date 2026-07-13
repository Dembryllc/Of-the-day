import { Link } from 'react-router-dom';
import { useLayoutEffect } from 'react';
import './landing.css';

export default function PrivacyPage() {
  useLayoutEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevBodyBg = document.body.style.background;
    const prevBodyHeight = document.body.style.height;
    const prevHtmlHeight = document.documentElement.style.height;
    document.body.style.overflow = 'auto';
    document.body.style.background = '#fff';
    document.body.style.height = 'auto';
    document.documentElement.style.height = 'auto';
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.background = prevBodyBg;
      document.body.style.height = prevBodyHeight;
      document.documentElement.style.height = prevHtmlHeight;
    };
  }, []);

  return (
    <div className="lp">
      <nav className="lp-nav">
        <div className="nav-inner">
          <a href="/" className="nav-logo">
            <img src="/assets/ofthedaylogi.png" alt="OfTheDay" className="nav-logo-img" />
          </a>
          <div className="nav-actions">
            <Link to="/login" className="btn-ghost">Sign In</Link>
            <Link to="/dashboard" className="btn-primary">Try It Free</Link>
          </div>
        </div>
      </nav>

      <div className="lp-legal-page">
        <div className="container">
          <h1>Privacy Policy</h1>
          <p className="lp-legal-date">Effective date: June 1, 2026 · Last updated: June 1, 2026</p>

          <p>
            OfTheDay.net ("OfTheDay," "we," "us," or "our") is committed to protecting your
            privacy. This Privacy Policy explains how we collect, use, and protect information
            when you use our web application at oftheday.net.
          </p>

          <h2>1. Who We Are</h2>
          <p>
            OfTheDay.net is a morning meeting planning tool for K–12 educators. It is a
            teacher-facing tool. <strong>Students do not create accounts and do not submit
            personal information through OfTheDay.net.</strong> We do not collect, store,
            or process student personally identifiable information (PII).
          </p>

          <h2>2. What We Collect</h2>
          <h3>Account Information</h3>
          <p>When you create an account, we collect:</p>
          <ul>
            <li>Email address</li>
            <li>Name (optional, used to personalize your experience)</li>
            <li>Password (stored as a secure hash — we never see it in plain text)</li>
            <li>Sign-in method (email/password or Google)</li>
          </ul>

          <h3>Usage Data</h3>
          <p>We store the content you create or save in the app:</p>
          <ul>
            <li>Grade-level preference</li>
            <li>Saved routines and favorite activities</li>
            <li>Custom activities you build</li>
            <li>Custom vocabulary words and Do Now problems</li>
            <li>Projector display preferences</li>
          </ul>

          <h3>Payment Information</h3>
          <p>
            If you subscribe to a Pro or School plan, payment is processed by Stripe. We do
            not store your credit card number, CVV, or full payment details. Stripe handles
            all payment data under PCI DSS compliance. We store only a Stripe customer
            identifier and subscription status.
          </p>

          <h3>Technical Information</h3>
          <p>
            Our hosting provider (Google Firebase) may collect standard server logs including
            IP addresses, browser type, and page requests. We use this only for security
            monitoring and service reliability.
          </p>

          <h2>3. How We Use Your Information</h2>
          <ul>
            <li>To provide and operate the OfTheDay service</li>
            <li>To save your routines, activities, and preferences across devices</li>
            <li>To process subscription payments and manage your plan</li>
            <li>To send you service-related emails (account confirmation, trial reminders)</li>
            <li>To respond to your support requests</li>
            <li>To improve the product based on aggregate usage patterns</li>
          </ul>
          <p>We do not sell your personal information. We do not use your data for advertising.</p>

          <h2>4. FERPA</h2>
          <p>
            The Family Educational Rights and Privacy Act (FERPA) protects student education
            records. OfTheDay.net is a teacher planning tool — <strong>it does not collect,
            process, or store any student education records or student PII.</strong> Students
            do not use OfTheDay.net directly. As a result, FERPA obligations related to student
            data do not apply to OfTheDay.net.
          </p>
          <p>
            Teacher account information (name, email, grade preference, saved routines) is
            educator professional data, not student data, and is not subject to FERPA.
          </p>

          <h2>5. COPPA</h2>
          <p>
            The Children's Online Privacy Protection Act (COPPA) applies to websites directed
            at children under 13. OfTheDay.net is directed at adult educators, not children.
            We do not knowingly collect personal information from anyone under 13. If you
            believe a minor has created an account, contact us at <a href="mailto:dembryllc@gmail.com">dembryllc@gmail.com</a> and
            we will delete it promptly.
          </p>

          <h2>6. Data Storage and Security</h2>
          <p>
            Your data is stored in Google Firebase (Firestore and Firebase Authentication),
            hosted in US-based data centers. Google Firebase provides encryption in transit
            (TLS) and encryption at rest. Access to your account data is restricted to your
            authenticated session — other users cannot access your routines or activities.
          </p>
          <p>
            We follow security best practices including strict Firestore security rules that
            prevent any user from reading or modifying another user's data.
          </p>

          <h2>7. Data Retention and Deletion</h2>
          <p>
            Your account data is retained as long as your account is active. If you cancel
            your subscription, your account and saved content remain available on the Free tier.
            If you delete your account, all associated data (routines, custom activities,
            preferences) is permanently deleted within 30 days.
          </p>
          <p>
            To request account deletion, email <a href="mailto:dembryllc@gmail.com">dembryllc@gmail.com</a> with
            the subject line "Delete My Account."
          </p>

          <h2>8. Third-Party Services</h2>
          <table className="lp-legal-table">
            <thead>
              <tr><th>Service</th><th>Purpose</th><th>Privacy Policy</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Google Firebase</td>
                <td>Authentication, database, hosting</td>
                <td><a href="https://firebase.google.com/support/privacy" target="_blank" rel="noreferrer">firebase.google.com/support/privacy</a></td>
              </tr>
              <tr>
                <td>Stripe</td>
                <td>Payment processing</td>
                <td><a href="https://stripe.com/privacy" target="_blank" rel="noreferrer">stripe.com/privacy</a></td>
              </tr>
            </tbody>
          </table>

          <h2>9. Cookies</h2>
          <p>
            OfTheDay.net uses browser local storage and session storage to remember your
            preferences (grade level, dismissed banners, sidebar state). We do not use
            third-party advertising cookies or tracking pixels.
          </p>

          <h2>10. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li><strong>Access</strong> the personal data we hold about you</li>
            <li><strong>Correct</strong> inaccurate information in your profile</li>
            <li><strong>Export</strong> your saved routines and activities (available in-app under Settings → Export Data)</li>
            <li><strong>Delete</strong> your account and all associated data</li>
          </ul>
          <p>
            To exercise any of these rights, email <a href="mailto:dembryllc@gmail.com">dembryllc@gmail.com</a>.
          </p>

          <h2>11. School and District Accounts</h2>
          <p>
            If your school or district purchases a School plan, the account administrator
            (typically a principal or technology coordinator) manages teacher seat assignments.
            The administrator can view which teacher accounts are active but cannot access
            any teacher's saved routines, custom activities, or personal content.
          </p>
          <p>
            Schools or districts that require a Data Processing Agreement (DPA) or Student
            Data Privacy Agreement (SDPA) should contact us at <a href="mailto:dembryllc@gmail.com">dembryllc@gmail.com</a>.
            Because OfTheDay does not process student data, a standard DPA is typically
            sufficient.
          </p>

          <h2>12. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy as the product evolves. We will notify you of
            material changes by email (to the address on your account) at least 14 days before
            the change takes effect. Continued use of OfTheDay.net after the effective date
            constitutes acceptance of the updated policy.
          </p>

          <h2>13. Contact</h2>
          <p>
            Questions about this policy or your data:<br />
            <strong>OfTheDay.net</strong><br />
            <a href="mailto:dembryllc@gmail.com">dembryllc@gmail.com</a>
          </p>
        </div>
      </div>

      <footer className="footer">
        <div className="footer-logo">of<span>·</span>the<span>·</span>day</div>
        <div className="footer-links">
          <a href="/#features">Features</a>
          <a href="/#pricing">Pricing</a>
          <a href="/#faq">FAQ</a>
          <a href="mailto:dembryllc@gmail.com">Contact</a>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/login">Sign In</Link>
        </div>
        <div className="footer-copy">© 2026 OfTheDay.net · Built for teachers who love their mornings.</div>
      </footer>
    </div>
  );
}
