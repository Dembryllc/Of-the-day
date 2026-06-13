import { Link } from 'react-router-dom';
import { useLayoutEffect } from 'react';
import './landing.css';

export default function TermsPage() {
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
            <Link to="/login?signup=1" className="btn-primary">Try It Free</Link>
          </div>
        </div>
      </nav>

      <div className="lp-legal-page">
        <div className="container">
          <h1>Terms of Service</h1>
          <p className="lp-legal-date">Effective date: June 1, 2026 · Last updated: June 1, 2026</p>

          <p>
            Please read these Terms of Service ("Terms") carefully before using OfTheDay.net.
            By creating an account or using the service, you agree to be bound by these Terms.
            If you do not agree, do not use OfTheDay.net.
          </p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            These Terms constitute a legally binding agreement between you ("User," "you") and
            OfTheDay.net ("OfTheDay," "we," "us"). By accessing or using the service at
            oftheday.net, you confirm that you are at least 18 years old, have the authority
            to enter into this agreement, and accept these Terms in full.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            OfTheDay.net is a web-based morning meeting planning tool for K–12 educators.
            The service provides daily activity suggestions, vocabulary words, warm-up
            problems, historical facts, a projector display mode, and tools to save and
            customize classroom routines.
          </p>
          <p>
            OfTheDay.net is designed for use by adult educators. It is not a student-facing
            platform. Students do not create accounts and should not submit personal
            information through this service.
          </p>

          <h2>3. Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account
            credentials and for all activity that occurs under your account. Notify us
            immediately at <a href="mailto:hello@oftheday.net">hello@oftheday.net</a> if
            you suspect unauthorized access.
          </p>
          <p>
            You may not share your account with other users or transfer your account to
            another person. Each teacher should create their own account.
          </p>

          <h2>4. Acceptable Use</h2>
          <p>You may use OfTheDay.net only for lawful purposes and in accordance with these Terms. You agree not to:</p>
          <ul>
            <li>Use the service for any purpose other than K–12 classroom planning and professional educator use</li>
            <li>Redistribute, resell, or sublicense access to the service or its content</li>
            <li>Reproduce, copy, or repackage the activity library for commercial sale or distribution</li>
            <li>Attempt to access, scrape, or extract the activity library in bulk by automated means</li>
            <li>Upload or transmit any content that is unlawful, harmful, threatening, or offensive</li>
            <li>Attempt to interfere with the security or integrity of the service</li>
            <li>Use the service to process or store student personally identifiable information</li>
            <li>Impersonate any person or misrepresent your affiliation with any organization</li>
          </ul>
          <p>
            We reserve the right to suspend or terminate accounts that violate these terms
            without notice or refund.
          </p>

          <h2>5. Subscriptions and Payment</h2>
          <h3>Free Plan</h3>
          <p>
            The Free plan is available at no cost and includes limited features as described
            on the pricing page. No credit card is required. We may change Free plan
            features at any time with reasonable notice.
          </p>

          <h3>Pro Plan</h3>
          <p>
            The Pro plan is a recurring subscription billed monthly or annually. Your
            subscription renews automatically at the end of each billing period unless
            cancelled. You authorize us to charge your payment method on file for each
            renewal period.
          </p>

          <h3>School Plan</h3>
          <p>
            School plans are invoiced annually. Seats are licensed per named user (teacher).
            Unused seats do not roll over. Payment terms are net-30 from invoice date unless
            otherwise agreed in writing.
          </p>

          <h3>Free Trial</h3>
          <p>
            New accounts begin with a 14-day Pro trial at no charge. If you do not upgrade
            before the trial ends, your account automatically reverts to the Free plan.
            No charge is made without explicit payment authorization.
          </p>

          <h3>Refunds</h3>
          <p>
            Monthly subscriptions are non-refundable. Annual subscriptions may be refunded
            on a pro-rata basis within 30 days of purchase if the service does not work as
            described. Contact <a href="mailto:hello@oftheday.net">hello@oftheday.net</a> to
            request a refund.
          </p>

          <h3>Price Changes</h3>
          <p>
            We may change subscription prices with at least 30 days' notice. Price changes
            take effect at the start of your next billing period. Continued use of the
            service after a price change constitutes acceptance of the new price.
          </p>

          <h2>6. Content Ownership</h2>
          <h3>Your Content</h3>
          <p>
            You retain ownership of any custom activities, vocabulary words, Do Now problems,
            and saved routines you create ("Your Content"). By storing Your Content on
            OfTheDay.net, you grant us a limited license to store, display, and back up
            Your Content solely for the purpose of providing the service to you.
          </p>

          <h3>Our Content</h3>
          <p>
            The OfTheDay activity library, interface, design, and all other content we
            provide ("Our Content") is owned by OfTheDay.net and protected by copyright
            and other intellectual property laws. You may use Our Content to plan and run
            classroom morning meetings. You may not reproduce or distribute Our Content
            for any commercial purpose.
          </p>

          <h2>7. Cancellation and Termination</h2>
          <p>
            You may cancel your subscription at any time from your account settings or by
            contacting <a href="mailto:hello@oftheday.net">hello@oftheday.net</a>. Cancellation
            takes effect at the end of your current billing period. Your account reverts
            to the Free plan; your saved content is retained subject to Free plan limits.
          </p>
          <p>
            We may suspend or terminate your account if you violate these Terms, if we
            have reason to believe your account has been compromised, or if we discontinue
            the service. We will provide reasonable notice where practicable.
          </p>
          <p>
            If we discontinue the service entirely, we will provide at least 60 days' notice
            and a pro-rata refund for any prepaid annual subscription period.
          </p>

          <h2>8. Disclaimer of Warranties</h2>
          <p>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY
            KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF
            MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
          <p>
            We do not warrant that the service will be uninterrupted, error-free, or free
            of harmful components. We do not warrant that any activity, vocabulary word, or
            content in the library is appropriate for every classroom context — you are
            responsible for reviewing content before use with students.
          </p>

          <h2>9. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, OFTHEDAY.NET SHALL NOT BE
            LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
            DAMAGES, INCLUDING LOSS OF DATA, LOSS OF REVENUE, OR LOSS OF GOODWILL, ARISING
            FROM YOUR USE OF OR INABILITY TO USE THE SERVICE.
          </p>
          <p>
            OUR TOTAL LIABILITY TO YOU FOR ANY CLAIM ARISING FROM THESE TERMS OR YOUR USE
            OF THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE 12 MONTHS
            PRECEDING THE CLAIM.
          </p>

          <h2>10. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless OfTheDay.net and its owners, officers,
            and employees from any claims, damages, or expenses (including reasonable legal
            fees) arising from your violation of these Terms or your use of the service.
          </p>

          <h2>11. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of New York, without regard
            to its conflict of law provisions. Any disputes arising from these Terms shall
            be resolved in the state or federal courts located in New York, and you consent
            to personal jurisdiction in those courts.
          </p>

          <h2>12. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. We will notify you of material
            changes by email at least 14 days before the change takes effect. Your continued
            use of the service after the effective date constitutes acceptance of the
            updated Terms.
          </p>
          <p>
            If you do not agree to the updated Terms, you must stop using the service and
            cancel your subscription before the effective date.
          </p>

          <h2>13. Contact</h2>
          <p>
            Questions about these Terms:<br />
            <strong>OfTheDay.net</strong><br />
            <a href="mailto:hello@oftheday.net">hello@oftheday.net</a>
          </p>
        </div>
      </div>

      <footer className="footer">
        <div className="footer-logo">of<span>·</span>the<span>·</span>day</div>
        <div className="footer-links">
          <a href="/#features">Features</a>
          <a href="/#pricing">Pricing</a>
          <a href="/#faq">FAQ</a>
          <a href="mailto:hello@oftheday.net">Contact</a>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/login">Sign In</Link>
        </div>
        <div className="footer-copy">© 2026 OfTheDay.net · Built for teachers who love their mornings.</div>
      </footer>
    </div>
  );
}
