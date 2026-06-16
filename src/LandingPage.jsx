import { useState, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './lib/firebase';
import './landing.css';

const FAQ_ITEMS = [
  { id: 'free', q: 'Is there a free plan?', a: 'Yes. The free plan includes the daily routine view, basic activity library, grade-level filtering, and up to 3 saved routines. No credit card required.' },
  { id: 'chromebook', q: 'Does it work on a Chromebook?', a: 'Yes. OfTheDay.net is a web app that runs in any modern browser — Chrome, Safari, Firefox, or Edge. No download or installation required.' },
  { id: 'projector', q: 'Can I use it with my classroom projector or smartboard?', a: 'Yes. Pro includes a dedicated full-screen projector view that opens in a second browser window. Choose from four visual themes — Calm, Bright, Minimal, or Primary — to match your classroom.' },
  { id: 'grades', q: 'What grade levels are supported?', a: 'K–2, 3–5, 6–8, and 9–12. The grade picker filters activities, vocabulary words, and Do Now problems to be appropriate for your students.' },
  { id: 'purchase', q: 'Does my school need to purchase it, or can I pay myself?', a: 'Individual teachers can subscribe directly with a credit card. School and district licensing (single invoice, multiple seats) is also available — contact us at hello@oftheday.net.' },
  { id: 'rc', q: 'Is this specifically for Responsive Classroom?', a: "It's built with Responsive Classroom structure in mind — the four Morning Meeting components are the foundation. But the activities work for any morning meeting format, including PBIS morning circles and SEL-focused check-in routines." },
  { id: 'cancel', q: 'What happens to my saved routines if I cancel?', a: 'Your routines and custom activities are yours. If you cancel Pro, you keep your account and any saved content — you\'ll just be moved to the Free tier limits (3 routines, 1 custom activity).' },
  { id: 'student-data', q: 'Does OfTheDay store student data?', a: 'No. OfTheDay.net is a teacher planning tool — students do not create accounts and do not submit any information through this service. We collect only teacher account information (name, email, grade preference, saved routines). No student personally identifiable information (PII) is ever collected or stored, which means FERPA exposure is minimal.' },
  { id: 'dpa', q: 'Is a Data Privacy Agreement (DPA) available?', a: 'Yes. Because OfTheDay does not process student data, a standard DPA is typically sufficient for district procurement. Email us at hello@oftheday.net with the subject "DPA Request" and we will respond within 2 business days.' },
];

export default function LandingPage() {
  const [navOpen, setNavOpen] = useState(false);
  const [openFaqId, setOpenFaqId] = useState(null);
  const [captureSubmitted, setCaptureSubmitted] = useState(false);
  const [captureEmail, setCaptureEmail] = useState('');
  const [billingPeriod, setBillingPeriod] = useState('annual');
  const [schoolForm, setSchoolForm] = useState({ name: '', school: '', email: '' });
  const [schoolSubmitted, setSchoolSubmitted] = useState(false);

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

  const toggleFaq = (id) => setOpenFaqId(prev => prev === id ? null : id);

  const handleSchoolInquiry = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'waitlist'), {
        name: schoolForm.name.trim(),
        school: schoolForm.school.trim(),
        email: schoolForm.email.trim().toLowerCase(),
        source: 'school-inquiry',
        submittedAt: serverTimestamp(),
      });
    } catch {
      // Fail silently — still confirm to the user
    }
    setSchoolSubmitted(true);
  };

  const handleCapture = async (e) => {
    e.preventDefault();
    const email = captureEmail.trim().toLowerCase();
    try {
      await addDoc(collection(db, 'waitlist'), {
        email,
        source: 'landing-page',
        submittedAt: serverTimestamp(),
      });
    } catch {
      // Firestore save failed silently
    }
    try {
      const sendLeadMagnet = httpsCallable(functions, 'sendLeadMagnet');
      await sendLeadMagnet({ email });
    } catch {
      // Email send failed silently — submission still confirmed to user
    }
    setCaptureSubmitted(true);
  };

  return (
    <div className="lp">

      {/* ══════════ NAV ══════════ */}
      <nav className="lp-nav">
        <div className="nav-inner">
          <a href="/" className="nav-logo">
            <img src="/assets/ofthedaylogi.png" alt="OfTheDay" className="nav-logo-img" />
          </a>
          <ul className={`nav-links${navOpen ? ' open' : ''}`} id="nav-links">
            <li><a href="#features" onClick={() => setNavOpen(false)}>Features</a></li>
            <li><a href="#how-it-works" onClick={() => setNavOpen(false)}>How It Works</a></li>
            <li><a href="#pricing" onClick={() => setNavOpen(false)}>Pricing</a></li>
            <li><a href="#faq" onClick={() => setNavOpen(false)}>FAQ</a></li>
            <li><Link to="/login?signup=1" onClick={() => setNavOpen(false)}>Get Started Free</Link></li>
          </ul>
          <div className="nav-actions">
            <Link to="/login" className="btn-ghost">Sign In</Link>
            <Link to="/login?signup=1" className="btn-primary">Try It Free</Link>
          </div>
          <button className="hamburger" onClick={() => setNavOpen(o => !o)} aria-label="Open menu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>

      {/* ══════════ HERO ══════════ */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-badge">
              <span></span> Built for Responsive Classroom Teachers
            </div>
            <h1>Your Morning Meeting,<br /><em>Ready Before First Bell.</em></h1>
            <p className="hero-sub">
              Stop scrambling for activities every morning. OfTheDay.net builds a complete,
              grade-appropriate routine — Greeting, Sharing, Group Activity, and Morning Message —
              the moment you open it.
            </p>
            <div className="hero-ctas">
              <Link to="/login?signup=1" className="btn-primary-lg">Try It Free — No Credit Card</Link>
              <a href="#how-it-works" className="btn-secondary-lg">See How It Works</a>
            </div>
            <p className="hero-note">Free plan available · Grades K–2, 3–5, 6–8, 9–12</p>
          </div>

          <div className="hero-visual">
            <div className="app-mockup">
              <div className="mockup-bar">
                <div className="mockup-dot"></div>
                <div className="mockup-dot"></div>
                <div className="mockup-dot"></div>
              </div>
              <div className="mockup-body">
                <div className="mockup-sidebar">
                  <div className="mockup-nav-item lp-active">☀</div>
                  <div className="mockup-nav-item">⊞</div>
                  <div className="mockup-nav-item">▦</div>
                </div>
                <div className="mockup-main">
                  <div className="mockup-header">Today's Meeting</div>
                  <div className="mockup-date">Grade 3–5 · ~18 min</div>
                  <div className="activity-card lp-selected">
                    <div className="activity-stripe" style={{background:'#7EC8A4'}}></div>
                    <div className="activity-info">
                      <div className="activity-cat">Greeting</div>
                      <div className="activity-title">Would You Rather Welcome</div>
                      <div className="activity-meta">2 min · Low energy</div>
                    </div>
                  </div>
                  <div className="activity-card">
                    <div className="activity-stripe" style={{background:'#7AACDA'}}></div>
                    <div className="activity-info">
                      <div className="activity-cat">Sharing</div>
                      <div className="activity-title">Weekend Weather Report</div>
                      <div className="activity-meta">5 min · Medium energy</div>
                    </div>
                  </div>
                  <div className="activity-card">
                    <div className="activity-stripe" style={{background:'#F2C06E'}}></div>
                    <div className="activity-info">
                      <div className="activity-cat">Group Activity</div>
                      <div className="activity-title">Zip Zap Zoom</div>
                      <div className="activity-meta">7 min · High energy</div>
                    </div>
                  </div>
                  <div className="activity-card">
                    <div className="activity-stripe" style={{background:'#B09FDB'}}></div>
                    <div className="activity-info">
                      <div className="activity-cat">Morning Message</div>
                      <div className="activity-title">Today's Focus Prompt</div>
                      <div className="activity-meta">4 min · Low energy</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ TRUST BAR ══════════ */}
      <div className="trust-bar">
        <div className="trust-bar-inner">
          <div className="trust-stat">
            <span className="trust-num">180</span>
            <span className="trust-label">school days covered, every year</span>
          </div>
          <div className="trust-divider" aria-hidden="true"/>
          <div className="trust-stat">
            <span className="trust-num">30s</span>
            <span className="trust-label">to a complete morning routine</span>
          </div>
          <div className="trust-divider" aria-hidden="true"/>
          <div className="trust-stat">
            <span className="trust-num">Free</span>
            <span className="trust-label">to start — no credit card needed</span>
          </div>
        </div>
      </div>

      {/* ══════════ PROBLEM ══════════ */}
      <section className="problem" id="problem">
        <div className="container">
          <div className="problem-grid">
            <div className="problem-text">
              <div className="section-label">The Problem</div>
              <h2 className="section-title">Every Morning Before School, Thousands of Teachers Are Scrambling.</h2>
              <blockquote>
                "Searching Pinterest for a greeting activity. Googling 'responsive classroom
                morning meeting ideas.' Reusing the same circle activity for the third week
                in a row because there's no time to think.
                <br /><br />
                Morning meetings are the most important 15 minutes of the school day.
                But preparing them shouldn't eat into your planning time every single day."
              </blockquote>
            </div>
            <div className="problem-stat-group">
              <div className="stat-card">
                <div className="stat-number">15+</div>
                <div className="stat-label">minutes spent planning a single morning meeting</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">180</div>
                <div className="stat-label">school days that need a fresh routine every year</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">8</div>
                <div className="stat-label">activity categories built into the library</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">30s</div>
                <div className="stat-label">to have a complete routine ready with OfTheDay</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section id="how-it-works">
        <div className="container">
          <div className="solution-grid">
            <div>
              <div className="section-label">How It Works</div>
              <h2 className="section-title">Open It. See Your Meeting. Run Your Meeting.</h2>
              <p className="section-sub" style={{marginBottom:'40px'}}>
                Three steps. Thirty seconds. Done.
              </p>
              <div className="solution-steps">
                <div className="step">
                  <div className="step-num">1</div>
                  <div className="step-body">
                    <h3>Choose your grade level</h3>
                    <p>K–2, 3–5, 6–8, or 9–12. The app filters every activity, prompt, and vocabulary word to match your students.</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-num">2</div>
                  <div className="step-body">
                    <h3>See today's complete routine</h3>
                    <p>A Greeting, Sharing, Group Activity, and Morning Message are ready the moment you open the app. Swap any activity with one tap if you want a change.</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-num">3</div>
                  <div className="step-body">
                    <h3>Display on your projector</h3>
                    <p>One click opens a full-screen display view in a separate window. Four visual themes to match your classroom vibe. No Google Slides needed.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="solution-visual">
              <div className="routine-preview-title">Today's Routine · Grade 3–5</div>
              <div className="routine-row">
                <div className="routine-icon" style={{background:'rgba(126,200,164,0.15)'}}>👋</div>
                <div className="routine-info">
                  <div className="routine-cat" style={{color:'#7EC8A4'}}>Greeting</div>
                  <div className="routine-name">Would You Rather Welcome</div>
                  <div className="routine-time">2 min · Low energy</div>
                </div>
              </div>
              <div className="routine-row">
                <div className="routine-icon" style={{background:'rgba(122,172,218,0.15)'}}>💬</div>
                <div className="routine-info">
                  <div className="routine-cat" style={{color:'#7AACDA'}}>Sharing</div>
                  <div className="routine-name">Weekend Weather Report</div>
                  <div className="routine-time">5 min · Medium energy</div>
                </div>
              </div>
              <div className="routine-row">
                <div className="routine-icon" style={{background:'rgba(242,192,110,0.15)'}}>✦</div>
                <div className="routine-info">
                  <div className="routine-cat" style={{color:'#F2C06E'}}>Group Activity</div>
                  <div className="routine-name">Zip Zap Zoom</div>
                  <div className="routine-time">7 min · High energy</div>
                </div>
              </div>
              <div className="routine-row" style={{borderBottom:'none'}}>
                <div className="routine-icon" style={{background:'rgba(176,159,219,0.15)'}}>✎</div>
                <div className="routine-info">
                  <div className="routine-cat" style={{color:'#B09FDB'}}>Morning Message</div>
                  <div className="routine-name">Today's Focus Prompt</div>
                  <div className="routine-time">4 min · Low energy</div>
                </div>
              </div>
              <div style={{marginTop:'20px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <span style={{fontSize:'12px', color:'rgba(255,255,255,0.3)'}}>Total: ~18 min</span>
                <Link to="/login?signup=1" style={{fontSize:'12px', color:'#F5A623', textDecoration:'none', fontWeight:'700'}}>Open the app →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section className="features" id="features">
        <div className="container">
          <div className="text-center">
            <div className="section-label">Features</div>
            <h2 className="section-title">Everything Your Morning Routine Needs</h2>
            <p className="section-sub">One tool for the entire first 20 minutes of your day.</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">☀️</div>
              <h3>Daily Routine Builder</h3>
              <p>Automatic Greeting, Sharing, Group Activity, and Morning Message every day. Filter by grade level, time available, and class energy.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🖥️</div>
              <h3>Projector Mode</h3>
              <p>One-click full-screen display view for your classroom projector or smartboard. Four visual themes: Calm, Bright, Minimal, and Primary.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📖</div>
              <h3>Word of the Day</h3>
              <p>Grade-level vocabulary words ready every morning. Rotate through the bank or pick manually to match your current unit.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">✏️</div>
              <h3>Do Now Warm-Ups</h3>
              <p>Daily math and writing warm-up problems by grade band. Toggle between subjects. Build your own custom problems to match your curriculum.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⏳</div>
              <h3>On This Day</h3>
              <p>Classroom-appropriate historical facts for the current date — automatically filtered to remove content that isn't suitable for students.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🗂️</div>
              <h3>My Activities + Routines</h3>
              <p>Build your own activities and save your favourite routine combinations. Your custom content is stored and ready whenever you need it.</p>
            </div>
          </div>
        </div>
      </section>


      {/* ══════════ PRICING ══════════ */}
      <section id="pricing">
        <div className="container">
          <div className="text-center">
            <div className="section-label">Pricing</div>
            <h2 className="section-title">Start Free. Upgrade When You're Ready.</h2>
            <p className="section-sub">No credit card required to get started. Cancel anytime.</p>
          </div>

          <div className="billing-toggle">
            <button
              className={`billing-option${billingPeriod === 'monthly' ? ' active' : ''}`}
              onClick={() => setBillingPeriod('monthly')}
            >Monthly</button>
            <button
              className={`billing-option${billingPeriod === 'annual' ? ' active' : ''}`}
              onClick={() => setBillingPeriod('annual')}
            >Annual <span className="billing-save">Save 27%</span></button>
          </div>

          <div className="pricing-grid">

            <div className="pricing-card">
              <div className="pricing-tier">Free</div>
              <div className="pricing-price">$0</div>
              <div className="pricing-desc">Everything you need to try it out and see if it fits your classroom.</div>
              <ul className="pricing-features">
                <li>Daily routine — Today view</li>
                <li>Basic activity library</li>
                <li>3 saved routines</li>
                <li>1 custom activity</li>
                <li>Grade-level filtering (K–12)</li>
              </ul>
              <Link to="/login?signup=1" className="pricing-cta pricing-cta-outline">Get Started Free</Link>
            </div>

            <div className="pricing-card featured">
              <div className="pricing-badge">Most Popular</div>
              <div className="pricing-tier">Pro Teacher</div>
              {billingPeriod === 'annual' ? (
                <div className="pricing-price">
                  <sup>$</sup>79<span>/year</span>
                  <div className="pricing-per-month">$6.58/month — 2 months free</div>
                </div>
              ) : (
                <div className="pricing-price"><sup>$</sup>9<span>/month</span></div>
              )}
              <div className="pricing-desc">The full toolkit for teachers who run a structured morning meeting every day.</div>
              <ul className="pricing-features">
                <li>Everything in Free</li>
                <li>Full activity library — all categories</li>
                <li>Unlimited saved routines</li>
                <li>Unlimited custom activities</li>
                <li>Projector mode with 4 themes</li>
                <li>Word of the Day</li>
                <li>Do Now warm-up problems</li>
                <li>On This Day historical facts</li>
                <li>Cloud sync — all your devices</li>
              </ul>
              <Link to="/upgrade" className="pricing-cta pricing-cta-primary">
                {billingPeriod === 'annual' ? 'Start Annual Free Trial' : 'Start Pro Free Trial'}
              </Link>
            </div>

            <div className="pricing-card">
              <div className="pricing-tier">School</div>
              <div className="pricing-price"><sup>$</sup>199<span>/year</span></div>
              <div className="pricing-desc">Pro access for your whole building. One invoice, up to 50 teacher accounts.</div>
              <ul className="pricing-features">
                <li>Everything in Pro</li>
                <li>Up to 50 teacher accounts</li>
                <li>Priority email support</li>
                <li>Single invoice for the school</li>
              </ul>
              {schoolSubmitted ? (
                <div className="school-form-success">✓ Got it — we'll be in touch within 1 business day.</div>
              ) : (
                <form className="school-inquiry-form" onSubmit={handleSchoolInquiry}>
                  <input
                    type="text" placeholder="Your name" required
                    value={schoolForm.name}
                    onChange={e => setSchoolForm(f => ({ ...f, name: e.target.value }))}
                  />
                  <input
                    type="text" placeholder="School or district name" required
                    value={schoolForm.school}
                    onChange={e => setSchoolForm(f => ({ ...f, school: e.target.value }))}
                  />
                  <input
                    type="email" placeholder="your@school.edu" required
                    value={schoolForm.email}
                    onChange={e => setSchoolForm(f => ({ ...f, email: e.target.value }))}
                  />
                  <button type="submit" className="pricing-cta pricing-cta-outline">Request School Pricing</button>
                </form>
              )}
            </div>

          </div>
          <p style={{textAlign:'center', marginTop:'24px', fontSize:'13px', color:'#9CA3AF'}}>
            School and district licensing available. <a href="mailto:hello@oftheday.net?subject=School Pricing" style={{color:'#9CA3AF'}}>Contact us</a> for a quote.
          </p>
        </div>
      </section>

      {/* ══════════ FAQ ══════════ */}
      <section className="faq" id="faq">
        <div className="container">
          <div className="text-center">
            <div className="section-label">FAQ</div>
            <h2 className="section-title">Common Questions</h2>
          </div>
          <div className="faq-list">
            {FAQ_ITEMS.map(item => (
              <div className="faq-item" key={item.id}>
                <button
                  className={`faq-question${openFaqId === item.id ? ' open' : ''}`}
                  onClick={() => toggleFaq(item.id)}
                >
                  {item.q}
                  <span className="faq-icon">+</span>
                </button>
                <div className={`faq-answer${openFaqId === item.id ? ' open' : ''}`}>
                  {item.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ EMAIL CAPTURE ══════════ */}
      <section className="capture" id="waitlist">
        <div className="capture-inner">
          <h2>Get a Free Morning Meeting Resource Pack</h2>
          <p>10 ready-to-use activities — greetings, sharing prompts, group activities, and morning messages — sent straight to your inbox.</p>
          {captureSubmitted ? (
            <div className="capture-success">🎉 Sent! Check your inbox — it should arrive in under a minute.</div>
          ) : (
            <form className="capture-form" onSubmit={handleCapture}>
              <input
                type="email"
                placeholder="your@school.edu"
                required
                autoComplete="email"
                value={captureEmail}
                onChange={e => setCaptureEmail(e.target.value)}
              />
              <button type="submit">Send Me the Pack</button>
            </form>
          )}
          <p className="capture-note">No spam. Unsubscribe anytime. We'll never share your email.</p>
        </div>
      </section>

      {/* ══════════ FINAL CTA ══════════ */}
      <section className="final-cta">
        <div className="container">
          <h2>Start Your Day With a Plan.</h2>
          <p>Open OfTheDay.net and your morning meeting is ready in seconds.</p>
          <div className="final-cta-actions">
            <Link to="/login?signup=1" className="btn-primary-lg">Try It Free — No Credit Card</Link>
            <Link to="/login" style={{fontSize:'15px', color:'rgba(255,255,255,0.5)', textDecoration:'none', fontWeight:500}}>Already have an account? Sign In →</Link>
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="footer">
        <div className="footer-logo">of<span>·</span>the<span>·</span>day</div>
        <div className="footer-links">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
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
