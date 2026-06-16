import { Link } from 'react-router-dom';
import { useLayoutEffect, useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './lib/firebase';
import './landing.css';

export default function DistrictPage() {
  const [form, setForm] = useState({ name: '', title: '', district: '', email: '', seats: '' });
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await addDoc(collection(db, 'waitlist'), {
        name: form.name.trim(),
        title: form.title.trim(),
        district: form.district.trim(),
        email: form.email.trim().toLowerCase(),
        seats: form.seats.trim(),
        source: 'district-inquiry',
        submittedAt: serverTimestamp(),
      });
    } catch {}
    setSubmitted(true);
    setBusy(false);
  };

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

      <div className="lp-legal-page" style={{maxWidth: 760}}>
        <div className="container">

          {/* Hero */}
          <h1 style={{fontSize:'2rem', marginBottom:8}}>OfTheDay for Schools &amp; Districts</h1>
          <p style={{fontSize:'1.1rem', color:'#4B5563', marginBottom:40}}>
            Everything your IT director, curriculum coordinator, and purchasing office needs to approve OfTheDay.net — in one place.
          </p>

          {/* No student data callout */}
          <div style={{background:'#F0FDF4', border:'1.5px solid #86EFAC', borderRadius:12, padding:'20px 24px', marginBottom:40}}>
            <div style={{fontWeight:700, fontSize:'1rem', color:'#166534', marginBottom:6}}>✓ No student data. No FERPA exposure.</div>
            <p style={{margin:0, color:'#15803D', fontSize:'0.95rem'}}>
              OfTheDay is a <strong>teacher planning tool</strong>. Students never create accounts, never log in, and never submit any information through this service.
              We collect only teacher account data (name, email, grade preference, saved routines). No student PII is collected, processed, or stored — ever.
            </p>
          </div>

          {/* Privacy & Compliance */}
          <h2>Privacy &amp; Compliance</h2>

          <h3>FERPA</h3>
          <p>OfTheDay does not meet the definition of an "education record" operator under FERPA because it collects no student education records. Teachers use OfTheDay to plan their morning meeting — the tool is invisible to students entirely. No FERPA-covered data is involved.</p>

          <h3>COPPA</h3>
          <p>OfTheDay is a teacher-facing product. Children under 13 do not create accounts or interact with the service in any way. COPPA does not apply.</p>

          <h3>Data Processing Agreement (DPA)</h3>
          <p>Because OfTheDay does not process student data, most districts find that a standard vendor DPA is unnecessary. However, if your district requires a DPA for all third-party software regardless of student data status, we will execute one. Email <a href="mailto:hello@oftheday.net?subject=DPA Request">hello@oftheday.net</a> with the subject "DPA Request" and we will respond within 2 business days.</p>

          <h3>Data collected from teachers</h3>
          <ul>
            <li>Name and email address (account creation)</li>
            <li>Grade level preference</li>
            <li>Saved routines, favorite activities, and custom activities (created by the teacher)</li>
            <li>Usage streak and projector style preferences (stored in browser localStorage)</li>
          </ul>
          <p>We do not sell teacher data to third parties. We do not use teacher data for advertising. Full details: <Link to="/privacy">Privacy Policy</Link>.</p>

          <h3>Data storage &amp; security</h3>
          <ul>
            <li>Hosted on <strong>Firebase (Google Cloud)</strong> — SOC 2 Type II, ISO 27001 certified infrastructure</li>
            <li>Data stored in <strong>us-central1</strong> (Iowa, USA)</li>
            <li>All traffic encrypted in transit (TLS 1.2+)</li>
            <li>Authentication via Firebase Auth — passwords are never stored in plaintext</li>
            <li>Firestore security rules restrict each teacher to their own data only</li>
          </ul>

          {/* Pricing */}
          <h2>School &amp; District Pricing</h2>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:32}}>
            <div style={{border:'1.5px solid #E5E7EB', borderRadius:12, padding:'20px 24px'}}>
              <div style={{fontWeight:700, fontSize:'1rem', marginBottom:4}}>School License</div>
              <div style={{fontSize:'1.5rem', fontWeight:800, color:'#1B2D5B', marginBottom:8}}>$199<span style={{fontSize:'1rem', fontWeight:400, color:'#6B7280'}}>/year</span></div>
              <ul style={{paddingLeft:18, color:'#374151', fontSize:'0.9rem', lineHeight:1.7}}>
                <li>Up to 50 teacher accounts</li>
                <li>All Pro features</li>
                <li>Single purchase order / invoice</li>
                <li>Priority email support</li>
              </ul>
            </div>
            <div style={{border:'1.5px solid #E5E7EB', borderRadius:12, padding:'20px 24px'}}>
              <div style={{fontWeight:700, fontSize:'1rem', marginBottom:4}}>District License</div>
              <div style={{fontSize:'1.5rem', fontWeight:800, color:'#1B2D5B', marginBottom:8}}>Custom</div>
              <ul style={{paddingLeft:18, color:'#374151', fontSize:'0.9rem', lineHeight:1.7}}>
                <li>Unlimited teacher accounts</li>
                <li>All Pro features</li>
                <li>Single purchase order / invoice</li>
                <li>Dedicated onboarding support</li>
                <li>Usage report on request</li>
              </ul>
            </div>
          </div>
          <p style={{fontSize:'0.9rem', color:'#6B7280'}}>
            Individual teachers can subscribe at <strong>$79/year</strong> with a credit card and expense it. Many districts approve reimbursement without a formal procurement process at this price point.
          </p>

          {/* FAQ */}
          <h2>Common IT &amp; Procurement Questions</h2>

          <h3>Does this require any student-facing setup?</h3>
          <p>No. OfTheDay is opened by the teacher on their device and projected to the class. Students do not visit the website, download an app, or create accounts.</p>

          <h3>Does it integrate with Google Classroom or Clever?</h3>
          <p>Not currently. Teachers sign in with email/password or a personal Google account. District SSO (Google Workspace for Education, Clever, ClassLink) is on our roadmap for 2026–27.</p>

          <h3>Can we pilot it with one grade level or department before purchasing?</h3>
          <p>Yes — individual teacher accounts are free to start with no credit card required. A building coordinator can share the sign-up link with any group of teachers for a no-cost pilot.</p>

          <h3>What happens to teacher data if we cancel?</h3>
          <p>Teachers can export their saved routines and custom activities at any time from their profile. Upon account deletion request, all data is permanently removed within 30 days.</p>

          <h3>Is there a W-9 or vendor registration form?</h3>
          <p>Yes. Email <a href="mailto:hello@oftheday.net?subject=Vendor Registration">hello@oftheday.net</a> with the subject "Vendor Registration" and we'll return the completed form within 2 business days.</p>

          <h3>Who is the company behind this?</h3>
          <p>OfTheDay.net is built by a team of educators and developers. The product was designed by a practicing K–12 special education teacher with 24 years of classroom experience. Questions go directly to the people who built it.</p>

          {/* Contact form */}
          <h2>Contact Us</h2>
          <p>Fill out the form below and we'll respond within 1 business day. Or email us directly at <a href="mailto:hello@oftheday.net">hello@oftheday.net</a>.</p>

          {submitted ? (
            <div style={{background:'#F0FDF4', border:'1.5px solid #86EFAC', borderRadius:12, padding:'20px 24px', marginBottom:32}}>
              <div style={{fontWeight:700, color:'#166534'}}>✓ Got it — we'll be in touch within 1 business day.</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:12, maxWidth:480, marginBottom:40}}>
              <input
                type="text" placeholder="Your name" required
                value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                style={{padding:'10px 14px', border:'1.5px solid #D1D5DB', borderRadius:8, fontSize:'0.95rem'}}
              />
              <input
                type="text" placeholder="Your title (e.g. Curriculum Coordinator, IT Director)"
                value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
                style={{padding:'10px 14px', border:'1.5px solid #D1D5DB', borderRadius:8, fontSize:'0.95rem'}}
              />
              <input
                type="text" placeholder="School or district name" required
                value={form.district} onChange={e => setForm(f => ({...f, district: e.target.value}))}
                style={{padding:'10px 14px', border:'1.5px solid #D1D5DB', borderRadius:8, fontSize:'0.95rem'}}
              />
              <input
                type="email" placeholder="your@district.edu" required
                value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))}
                style={{padding:'10px 14px', border:'1.5px solid #D1D5DB', borderRadius:8, fontSize:'0.95rem'}}
              />
              <input
                type="text" placeholder="Approximate number of teachers (optional)"
                value={form.seats} onChange={e => setForm(f => ({...f, seats: e.target.value}))}
                style={{padding:'10px 14px', border:'1.5px solid #D1D5DB', borderRadius:8, fontSize:'0.95rem'}}
              />
              <button
                type="submit" disabled={busy}
                style={{padding:'12px 24px', background:'#1B2D5B', color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:'0.95rem', cursor:'pointer'}}
              >
                {busy ? 'Sending…' : 'Send Inquiry'}
              </button>
            </form>
          )}

          <div style={{borderTop:'1px solid #E5E7EB', paddingTop:24, marginTop:8, display:'flex', gap:24, flexWrap:'wrap'}}>
            <Link to="/">← Back to OfTheDay.net</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <a href="mailto:hello@oftheday.net">hello@oftheday.net</a>
          </div>

        </div>
      </div>
    </div>
  );
}
