import { useState, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './lib/firebase';
import './landing.css';

const FAQ_ITEMS = [
  { id: 'free', q: 'Is there a free plan?', a: 'Yes. The free plan includes the daily routine view, basic activity library, grade-level filtering, up to 3 saved routines, and 5 AI lesson slides per month. No credit card required.' },
  { id: 'lesson-slides', q: 'What is the AI Lesson Slide Creator?', a: 'The AI Lesson Slide Creator lets you describe a lesson objective and automatically generates a complete structured slide — learning target, essential question, success criteria, key vocabulary, student task, discussion prompt, and exit ticket. Free accounts get 5 slides per month; Pro accounts get unlimited.' },
  { id: 'export', q: 'Can I export slides to PowerPoint or Google Slides?', a: 'Yes. Every slide exports as a .pptx file that opens natively in PowerPoint or Google Slides (File → Open). All four visual themes export with full formatting, colors, and layout preserved.' },
  { id: 'chromebook', q: 'Does it work on a Chromebook?', a: 'Yes. OfTheDay.net is a web app that runs in any modern browser — Chrome, Safari, Firefox, or Edge. No download or installation required.' },
  { id: 'projector', q: 'Can I use it with my classroom projector or smartboard?', a: 'Yes. Pro includes a dedicated full-screen projector view that opens in a second browser window. Choose from four visual themes — Calm, Bright, Minimal, or Primary — to match your classroom.' },
  { id: 'grades', q: 'What grade levels are supported?', a: 'K–2, 3–5, 6–8, and 9–12. The grade picker filters activities, vocabulary words, Do Now problems, and AI slide content to match your students.' },
  { id: 'purchase', q: 'Does my school need to purchase it, or can I pay myself?', a: 'Individual teachers can subscribe directly with a credit card. School and district licensing (single invoice, multiple seats) is also available — contact us at dembryllc@gmail.com.' },
  { id: 'rc', q: 'Is this specifically for Responsive Classroom?', a: "It's built with Responsive Classroom structure in mind — the four Morning Meeting components are the foundation. But the activities work for any morning meeting format, including PBIS morning circles and SEL-focused check-in routines." },
  { id: 'cancel', q: 'What happens to my saved routines if I cancel?', a: "Your routines and custom activities are yours. If you cancel Pro, you keep your account and any saved content — you'll just be moved to the Free tier limits." },
  { id: 'student-data', q: 'Does OfTheDay store student data?', a: 'No. OfTheDay.net is a teacher planning tool — students do not create accounts and submit no information through this service. We collect only teacher account information (name, email, grade preference, saved routines). No student PII is ever collected or stored.' },
  { id: 'dpa', q: 'Is a Data Privacy Agreement (DPA) available?', a: 'Yes. Because OfTheDay does not process student data, a standard DPA is typically sufficient for district procurement. Email dembryllc@gmail.com with the subject "DPA Request" and we will respond within 2 business days.' },
];

const SLIDE_THEMES = [
  { id: 'focus', label: 'Clear Focus' },
  { id: 'soft', label: 'Soft Structure' },
  { id: 'blocks', label: 'Bold Blocks' },
  { id: 'depth', label: 'Layered Depth' },
];

export default function LandingPage() {
  const [navOpen, setNavOpen] = useState(false);
  const [openFaqId, setOpenFaqId] = useState(null);
  const [captureSubmitted, setCaptureSubmitted] = useState(false);
  const [captureEmail, setCaptureEmail] = useState('');
  const [billingPeriod, setBillingPeriod] = useState('annual');
  const [schoolForm, setSchoolForm] = useState({ name: '', school: '', email: '' });
  const [schoolSubmitted, setSchoolSubmitted] = useState(false);
  const [slideTheme, setSlideTheme] = useState('focus');

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
    } catch {}
    setSchoolSubmitted(true);
  };

  const handleCapture = async (e) => {
    e.preventDefault();
    const email = captureEmail.trim().toLowerCase();
    try {
      await addDoc(collection(db, 'waitlist'), { email, source: 'landing-page', submittedAt: serverTimestamp() });
    } catch {}
    try {
      const sendLeadMagnet = httpsCallable(functions, 'sendLeadMagnet');
      await sendLeadMagnet({ email });
    } catch {}
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
          <div className={`nav-collapse${navOpen ? ' open' : ''}`}>
            <ul className="nav-links" id="nav-links">
              <li><a href="#features" onClick={() => setNavOpen(false)}>Features</a></li>
              <li><a href="#slides" onClick={() => setNavOpen(false)}>Lesson Slides</a></li>
              <li><a href="#how-it-works" onClick={() => setNavOpen(false)}>How It Works</a></li>
              <li><a href="#pricing" onClick={() => setNavOpen(false)}>Pricing</a></li>
              <li><a href="#faq" onClick={() => setNavOpen(false)}>FAQ</a></li>
              <li><Link to="/district" onClick={() => setNavOpen(false)}>For Districts</Link></li>
            </ul>
            <div className="nav-actions">
              <Link to="/login" className="btn-ghost" onClick={() => setNavOpen(false)}>Sign In</Link>
              <Link to="/demo" className="btn-ghost" onClick={() => setNavOpen(false)}>Live Demo</Link>
              <Link to="/login?signup=1" className="btn-primary" onClick={() => setNavOpen(false)}>Try It Free</Link>
            </div>
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
              <span></span> For Teachers Who Care About Classroom Culture
            </div>
            <h1>Start Every Day With a Morning Meeting<br /><em>Students Actually Look Forward To</em></h1>
            <p className="hero-sub">
              Every day, OfTheDay builds a fresh, balanced Morning Meeting with greetings, sharing, group activities, and morning messages inspired by proven classroom routines — so your class starts with structure, connection, and energy.
            </p>
            <div className="hero-pills">
              <span className="hero-pill">☀️ Morning Meetings</span>
              <span className="hero-pill">📚 Responsive Classroom-Inspired</span>
              <span className="hero-pill">🎓 Grades K–12</span>
              <span className="hero-pill">🖥️ Projector Ready</span>
            </div>
            <div className="hero-ctas">
              <Link to="/login?signup=1" className="btn-primary-lg">Try It Free — No Credit Card</Link>
              <Link to="/demo" className="btn-secondary-lg">See a Live Demo</Link>
            </div>
            <p className="hero-note">Free plan available · No setup required</p>
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
                  <div className="mockup-nav-item">🖼</div>
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
                  <div className="mockup-word-chip">
                    Word of the Day: <strong>Perseverance</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ PAIN SECTION ══════════ */}
      <section className="pain-section">
        <div className="container">
          <div className="text-center">
            <h2 className="section-title">Stop Reusing the Same Morning Meeting Slides</h2>
            <p className="section-sub">You know Morning Meeting matters. But creating something fresh every day takes energy teachers do not always have at 7:15 AM. OfTheDay gives you a complete routine before students walk in — so your day starts with structure instead of scrambling.</p>
          </div>
          <div className="pain-grid">
            <div className="pain-card">
              <div className="pain-icon" aria-hidden="true">🔁</div>
              <h3>Running Out of Fresh Activities</h3>
              <p>Greetings, sharing prompts, and group games cycle through faster than you'd like. By November, you're repeating.</p>
            </div>
            <div className="pain-card">
              <div className="pain-icon" aria-hidden="true">📋</div>
              <h3>Repeating the Same Slides</h3>
              <p>Yesterday's Morning Meeting looks a lot like today's. Your slides do too. Students notice.</p>
            </div>
            <div className="pain-card">
              <div className="pain-icon" aria-hidden="true">⏰</div>
              <h3>Starting the Day Without Structure</h3>
              <p>A meeting without clear parts, timing, and purpose feels chaotic. Students need predictability and energy.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ MEETING STRUCTURE ══════════ */}
      <section className="meeting-structure">
        <div className="container">
          <div className="text-center">
            <h2 className="section-title">A Complete Morning Meeting in Four Balanced Parts</h2>
            <p className="section-sub">Each routine is assembled to create a balanced classroom experience — predictable enough for structure, fresh enough to keep students excited.</p>
          </div>
          <div className="meeting-grid">
            <div className="meeting-card">
              <div className="meeting-color" aria-hidden="true" style={{background:'#7EC8A4'}}></div>
              <h3>Greeting</h3>
              <p className="meeting-purpose">Help students feel seen from the moment they enter.</p>
              <p>A warm welcome that sets a positive tone and builds connection.</p>
            </div>
            <div className="meeting-card">
              <div className="meeting-color" aria-hidden="true" style={{background:'#7AACDA'}}></div>
              <h3>Sharing</h3>
              <p className="meeting-purpose">Give students a structured way to connect and communicate.</p>
              <p>Prompts that invite participation without pressure.</p>
            </div>
            <div className="meeting-card">
              <div className="meeting-color" aria-hidden="true" style={{background:'#F2C06E'}}></div>
              <h3>Group Activity</h3>
              <p className="meeting-purpose">Build energy, movement, collaboration, and community.</p>
              <p>Games and activities that get everyone involved.</p>
            </div>
            <div className="meeting-card">
              <div className="meeting-color" aria-hidden="true" style={{background:'#B09FDB'}}></div>
              <h3>Morning Message</h3>
              <p className="meeting-purpose">Set the tone, focus, and purpose for the day.</p>
              <p>A clear, focused message to center student attention.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section className="features" id="features">
        <div className="container">
          <div className="text-center">
            <h2 className="section-title">Everything Built Into Morning Meeting</h2>
            <p className="section-sub">One app handles all the pieces of a fresh, structured start to the day.</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">☀️</div>
              <h3>Daily Routine Builder</h3>
              <p>Never wonder what Morning Meeting looks like today. Get a complete Greeting, Sharing, Group Activity, and Morning Message ready for your grade band.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🖥️</div>
              <h3>Projector Mode</h3>
              <p>One click and your routine is classroom-ready on the board. Choose from 4 polished themes to match your classroom style.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📖</div>
              <h3>Word of the Day</h3>
              <p>Build vocabulary in a simple daily routine students can return to all year. Rotate through or pick to match your current unit.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">✏️</div>
              <h3>Do Now Warm-Ups</h3>
              <p>Start class with quick academic warm-ups that match your grade level. Math and writing problems ready every morning.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⏳</div>
              <h3>On This Day</h3>
              <p>Bring classroom-appropriate history into the day with facts filtered for student suitability. A built-in conversation starter.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🗂️</div>
              <h3>My Activities &amp; Routines</h3>
              <p>Save your favorite activities and build custom routines that match your teaching style. Your content stays with you.</p>
            </div>
            <div className="feature-card feature-card-ai">
              <div className="feature-icon feature-icon-blue">✨</div>
              <h3>AI Lesson Slide Creator</h3>
              <p>When you need a structured lesson slide fast, generate one in seconds. Describe your objective and export to PowerPoint or Google Slides.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Grade-Level Filtering</h3>
              <p>Choose your grade band once and keep activities, vocabulary, warm-ups, and slides aligned to your students all year.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">☁️</div>
              <h3>Cloud Sync</h3>
              <p>Your routines and custom activities follow you across devices. Open on your phone at home, project from your laptop in class.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏫</div>
              <h3>No Student Data. Ever.</h3>
              <p>Use OfTheDay without uploading student names, student work, or personally identifiable student information. FERPA-friendly by design.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FOUNDER STORY ══════════ */}
      <section className="founder-story">
        <div className="container">
          <div className="founder-inner">
            <h2>Built From Real Classroom Experience</h2>
            <p>Created by a veteran special education teacher after years of running Morning Meetings, repeating the same activities, and running out of fresh ideas. OfTheDay was built to give teachers a better way to start every day.</p>
          </div>
        </div>
      </section>

      {/* ══════════ SLIDE SPOTLIGHT ══════════ */}
      <section className="slide-spotlight" id="slides">
        <div className="container">
          <div className="spotlight-grid">
            <div className="spotlight-copy">
              <div className="section-label spotlight-label">AI Lesson Slides</div>
              <h2 className="section-title spotlight-title">Need a Lesson Slide Too? That's Built In.</h2>
              <p className="section-sub spotlight-sub">When you need a clean, structured lesson slide fast, describe your objective and OfTheDay creates a print-ready or presentation-ready slide with learning target, vocabulary, success criteria, student task, discussion prompt, and exit ticket.</p>
              <ul className="spotlight-checklist">
                <li>Learning target &amp; essential question</li>
                <li>3 success criteria for student self-assessment</li>
                <li>Key vocabulary with definitions</li>
                <li>Student task, discussion prompt &amp; exit ticket</li>
                <li>4 themes — all export-ready with full formatting</li>
              </ul>
              <Link to="/login?signup=1" className="btn-primary-lg">Try Lesson Slides Free</Link>
            </div>
            <div className="spotlight-visual">
              <div className="theme-switcher">
                {SLIDE_THEMES.map(t => (
                  <button
                    key={t.id}
                    className={`theme-btn${slideTheme === t.id ? ' active' : ''}`}
                    onClick={() => setSlideTheme(t.id)}
                  >{t.label}</button>
                ))}
              </div>
              <div className={`lp-slide-mock sm-${slideTheme}`}>
                <div className="sm-hdr">
                  <span className="sm-lesson-name">SCIENCE · GRADE 3–5</span>
                  <span className="sm-hdr-right">OfTheDay.net</span>
                </div>
                <div className="sm-lt-row">
                  <div className="sm-lt">
                    <div className="sm-slabel">LEARNING TARGET</div>
                    <div className="sm-lt-text">Students will explain how photosynthesis converts sunlight into food energy for plants.</div>
                  </div>
                  <div className="sm-eq">
                    <div className="sm-slabel">ESSENTIAL QUESTION</div>
                    <div className="sm-eq-text">How do living things get the energy they need to grow?</div>
                  </div>
                </div>
                <div className="sm-body">
                  <div className="sm-col">
                    <div className="sm-col-hdr sm-sc-hdr">
                      <span className="sm-col-label">SUCCESS CRITERIA</span>
                    </div>
                    <div className="sm-col-content">
                      <div className="sm-check"><span className="sm-ck">✓</span> Describe inputs of photosynthesis</div>
                      <div className="sm-check"><span className="sm-ck">✓</span> Explain what chlorophyll does</div>
                      <div className="sm-check"><span className="sm-ck">✓</span> Connect plants to the food chain</div>
                    </div>
                  </div>
                  <div className="sm-col sm-mid-col">
                    <div className="sm-col-hdr sm-vocab-hdr">
                      <span className="sm-col-label">KEY VOCABULARY</span>
                    </div>
                    <div className="sm-col-content">
                      <div className="sm-vocab"><span className="sm-vocab-word">Photosynthesis</span> — light to energy</div>
                      <div className="sm-vocab"><span className="sm-vocab-word">Chlorophyll</span> — green pigment</div>
                      <div className="sm-vocab"><span className="sm-vocab-word">Glucose</span> — plant sugar</div>
                    </div>
                  </div>
                  <div className="sm-col sm-right-col">
                    <div className="sm-col-hdr sm-task-hdr">
                      <span className="sm-col-label">STUDENT TASK</span>
                    </div>
                    <div className="sm-col-content sm-task-content">
                      Draw and label a plant showing where photosynthesis occurs.
                    </div>
                    <div className="sm-col-hdr sm-disc-hdr">
                      <span className="sm-col-label">DISCUSSION</span>
                    </div>
                    <div className="sm-col-content sm-sm-content">
                      Why are plants the color green?
                    </div>
                    <div className="sm-col-hdr sm-exit-hdr">
                      <span className="sm-col-label">EXIT TICKET</span>
                    </div>
                    <div className="sm-col-content sm-sm-content">
                      Name 3 things a plant needs.
                    </div>
                  </div>
                </div>
              </div>
              <div className="slide-export-chips">
                <span className="export-chip">⬇ Export as PowerPoint</span>
                <span className="export-chip">⬇ Open in Google Slides</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section id="how-it-works">
        <div className="container">
          <div className="text-center">
            <div className="section-label">How It Works</div>
            <h2 className="section-title">Open It. See Your Meeting. Run Your Day.</h2>
            <p className="section-sub" style={{margin:'0 auto 56px'}}>Three steps. Thirty seconds. Done.</p>
          </div>
          <div className="hiw-grid">
            <div className="hiw-step">
              <div className="hiw-num">1</div>
              <h3>Choose your grade level</h3>
              <p>K–2, 3–5, 6–8, or 9–12. One picker filters every activity, prompt, vocabulary word, and AI slide content to match your students.</p>
            </div>
            <div className="hiw-connector" aria-hidden="true">→</div>
            <div className="hiw-step">
              <div className="hiw-num">2</div>
              <h3>Your routine is ready instantly</h3>
              <p>A complete Morning Meeting — Greeting, Sharing, Group Activity, Morning Message — loads the moment you open the app. Swap any card with one tap.</p>
            </div>
            <div className="hiw-connector" aria-hidden="true">→</div>
            <div className="hiw-step">
              <div className="hiw-num">3</div>
              <h3>Generate a lesson slide</h3>
              <p>Describe any objective and AI builds a complete structured slide in under 30 seconds. Display full-screen, export to PowerPoint, or send to Google Slides.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ PRICING ══════════ */}
      <section id="pricing" style={{background:'#FAF8F4', borderTop:'1px solid rgba(0,0,0,0.06)'}}>
        <div className="container">
          <div className="text-center">
            <div className="section-label">Pricing</div>
            <h2 className="section-title">Start Free. Upgrade When You're Ready.</h2>
            <p className="section-sub">No credit card required to get started. Cancel anytime.</p>
          </div>

          <div className="billing-toggle">
            <button className={`billing-option${billingPeriod === 'monthly' ? ' active' : ''}`} onClick={() => setBillingPeriod('monthly')}>Monthly</button>
            <button className={`billing-option${billingPeriod === 'annual' ? ' active' : ''}`} onClick={() => setBillingPeriod('annual')}>Annual <span className="billing-save">Save 27%</span></button>
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
                <li>5 AI lesson slides per month</li>
                <li>PowerPoint &amp; Google Slides export</li>
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
              <div className="pricing-desc">The full toolkit for teachers who run a structured routine every day.</div>
              <ul className="pricing-features">
                <li>Everything in Free</li>
                <li>Full activity library — all categories</li>
                <li>Unlimited saved routines</li>
                <li>Unlimited custom activities</li>
                <li>Projector mode with 4 themes</li>
                <li>Word of the Day</li>
                <li>Do Now warm-up problems</li>
                <li>On This Day historical facts</li>
                <li>Unlimited AI lesson slides</li>
                <li>Simplify content for any grade level</li>
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
                  <input type="text" placeholder="Your name" required value={schoolForm.name} onChange={e => setSchoolForm(f => ({ ...f, name: e.target.value }))} />
                  <input type="text" placeholder="School or district name" required value={schoolForm.school} onChange={e => setSchoolForm(f => ({ ...f, school: e.target.value }))} />
                  <input type="email" placeholder="your@school.edu" required value={schoolForm.email} onChange={e => setSchoolForm(f => ({ ...f, email: e.target.value }))} />
                  <button type="submit" className="pricing-cta pricing-cta-outline">Request School Pricing</button>
                </form>
              )}
              <div style={{textAlign:'center', marginTop:'12px'}}>
                <Link to="/district" style={{fontSize:'0.8rem', color:'#6B7280'}}>Privacy &amp; compliance info for IT directors →</Link>
              </div>
            </div>
          </div>
          <p style={{textAlign:'center', marginTop:'24px', fontSize:'13px', color:'#9CA3AF'}}>
            School and district licensing available. <a href="mailto:dembryllc@gmail.com?subject=School Pricing" style={{color:'#9CA3AF'}}>Contact us</a> for a quote.
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
            <div className="capture-success">
              🎉 Sent! Check your inbox — it should arrive in under a minute.
              <a className="capture-download" href="/resources/morning-meeting-resource-pack.pdf" download>
                Or download the pack directly (PDF) ↓
              </a>
            </div>
          ) : (
            <form className="capture-form" onSubmit={handleCapture}>
              <input type="email" placeholder="your@school.edu" required autoComplete="email" value={captureEmail} onChange={e => setCaptureEmail(e.target.value)} />
              <button type="submit">Send Me the Pack</button>
            </form>
          )}
          <p className="capture-note">No spam. Unsubscribe anytime. We'll never share your email.</p>
        </div>
      </section>

      {/* ══════════ FINAL CTA ══════════ */}
      <section className="final-cta">
        <div className="container">
          <h2>Your Whole Morning,<br /><em>Handled.</em></h2>
          <p>Morning meetings built automatically. Lesson slides generated by AI. Open OfTheDay.net and start teaching.</p>
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
          <a href="#slides">Lesson Slides</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
          <a href="mailto:dembryllc@gmail.com">Contact</a>
          <Link to="/district">For Districts</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/login">Sign In</Link>
        </div>
        <div className="footer-copy">© 2026 OfTheDay.net · Built for teachers who love their mornings.</div>
      </footer>

    </div>
  );
}
