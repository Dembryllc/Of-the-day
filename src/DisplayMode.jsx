import React, { useState, useEffect } from 'react';
import { CAT_META } from './lib/catMeta';
import { PROJECTOR_THEMES, PROJECTOR_BACKGROUNDS, normalizeProjectorStyle, getProjectorBackgroundImage, DEFAULT_PROJECTOR_STYLE } from './lib/projector';

const PRESENTATION_VIEW_KEY = 'ofd:presentationView';

export default function DisplayMode({ routine, startIndex = 0, onExit, projectorStyle = DEFAULT_PROJECTOR_STYLE, initialView = "clean" }) {
  const [idx, setIdx] = useState(startIndex);
  const [presentationView, setPresentationView] = useState(initialView === "guided" ? "guided" : "clean");
  const baseStyle = normalizeProjectorStyle(projectorStyle);

  const [localTheme, setLocalTheme] = useState(baseStyle.theme);
  const [localFontSize, setLocalFontSize] = useState(baseStyle.textSize || "Large");
  const [localFontStyle, setLocalFontStyle] = useState("sans");
  const [localShowInstructions, setLocalShowInstructions] = useState(baseStyle.showStarter);
  const [localShowTimer, setLocalShowTimer] = useState(baseStyle.showTimer);
  const [showTeacherBar, setShowTeacherBar] = useState(false);

  const themePresets = {
    Dark:           { background: "#0A0A18", topColor: "#1B2D5B", accentColor: "#F5A623", textColor: "#FFFFFF" },
    Light:          { background: "#F8F9FC", topColor: "#1B2D5B", accentColor: "#F5A623", textColor: "#1B2D5B" },
    Warm:           { background: "#2C1A0E", topColor: "#5C3317", accentColor: "#F5A623", textColor: "#FFF8F0" },
    "High Contrast":{ background: "#000000", topColor: "#000000", accentColor: "#FFFF00", textColor: "#FFFFFF" },
  };
  const themePresetNames = Object.keys(themePresets);

  const style = {
    ...baseStyle,
    ...(themePresets[localTheme] || {}),
    textSize: localFontSize,
    showStarter: localShowInstructions,
    showTimer: localShowTimer,
  };
  const theme = PROJECTOR_THEMES[baseStyle.theme] || PROJECTOR_THEMES.Calm;

  const sizeClass = localFontSize === "XLarge" ? " xl" : localFontSize === "Small" ? " normal" : "";
  const fontClass = localFontStyle === "serif" ? " disp-serif" : "";
  const backgroundImage = getProjectorBackgroundImage({ ...baseStyle, backgroundColor: style.background || style.backgroundColor });
  const displayBackground = backgroundImage !== "none"
    ? { backgroundColor: style.background || style.backgroundColor, backgroundImage, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: style.background || style.backgroundColor };

  const act = routine[idx];
  const totalTime = act ? act.time : 180;
  const [secs, setSecs] = useState(totalTime);
  const [running, setRunning] = useState(true);

  useEffect(() => { setSecs(totalTime); setRunning(true); }, [idx, totalTime]);
  useEffect(() => { setPresentationView(initialView === "guided" ? "guided" : "clean"); }, [initialView]);
  useEffect(() => {
    if (!running || secs <= 0) return;
    const t = setTimeout(() => setSecs(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs, running]);
  useEffect(() => {
    const h = e => {
      if (e.key === "Escape") onExit();
      if (e.key === "ArrowRight" && idx < routine.length - 1) setIdx(i => i + 1);
      if (e.key === "ArrowLeft" && idx > 0) setIdx(i => i - 1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [idx, routine.length, onExit]);

  const fmt = s => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  const pct = Math.round((secs / totalTime) * 100);
  const cm = CAT_META[act?.cat] || { color: theme.accent, dark: theme.top };
  const isGuided = presentationView === "guided";

  const switchPresentationView = view => {
    const safeView = view === "guided" ? "guided" : "clean";
    setPresentationView(safeView);
    try { localStorage.setItem(PRESENTATION_VIEW_KEY, safeView); } catch {}
  };
  const resetTimer = () => { setSecs(totalTime); setRunning(false); };

  return (
    <div className={"display-mode" + sizeClass + fontClass + (isGuided ? " guided" : "")} style={{ ...displayBackground, "--display-accent": style.accentColor, "--display-surface": theme.surface, "--display-text": style.textColor }}>

      {/* ── TEACHER CONTROL BAR ── */}
      <div className={`disp-teacher-bar${showTeacherBar ? ' open' : ''}`}>
        <button className="disp-teacher-bar-toggle" type="button" onClick={() => setShowTeacherBar(v => !v)} aria-label="Toggle teacher controls">
          {showTeacherBar ? '✕ Close' : '⚙ Controls'}
        </button>
        {showTeacherBar && (
          <div className="disp-teacher-bar-inner">
            <div className="disp-ctrl-group">
              <div className="disp-ctrl-label">Theme</div>
              <div className="disp-ctrl-pills">
                {themePresetNames.map(t => (
                  <button key={t} type="button" className={`disp-ctrl-pill${localTheme === t ? ' active' : ''}`} onClick={() => setLocalTheme(t)}>{t}</button>
                ))}
              </div>
            </div>
            <div className="disp-ctrl-group">
              <div className="disp-ctrl-label">Font Size</div>
              <div className="disp-ctrl-pills">
                {["Small", "Medium", "Large", "XLarge"].map(s => (
                  <button key={s} type="button" className={`disp-ctrl-pill${localFontSize === s ? ' active' : ''}`} onClick={() => setLocalFontSize(s)}>{s}</button>
                ))}
              </div>
            </div>
            <div className="disp-ctrl-group">
              <div className="disp-ctrl-label">Font Style</div>
              <div className="disp-ctrl-pills">
                <button type="button" className={`disp-ctrl-pill${localFontStyle === 'sans' ? ' active' : ''}`} onClick={() => setLocalFontStyle('sans')}>Sans-Serif</button>
                <button type="button" className={`disp-ctrl-pill${localFontStyle === 'serif' ? ' active' : ''}`} onClick={() => setLocalFontStyle('serif')}>Serif</button>
              </div>
            </div>
            <div className="disp-ctrl-group">
              <div className="disp-ctrl-label">Instructions</div>
              <div className="disp-ctrl-pills">
                <button type="button" className={`disp-ctrl-pill${localShowInstructions ? ' active' : ''}`} onClick={() => setLocalShowInstructions(true)}>Show</button>
                <button type="button" className={`disp-ctrl-pill${!localShowInstructions ? ' active' : ''}`} onClick={() => setLocalShowInstructions(false)}>Hide</button>
              </div>
            </div>
            <div className="disp-ctrl-group">
              <div className="disp-ctrl-label">Timer</div>
              <div className="disp-ctrl-pills">
                <button type="button" className={`disp-ctrl-pill${localShowTimer ? ' active' : ''}`} onClick={() => setLocalShowTimer(true)}>Show</button>
                <button type="button" className={`disp-ctrl-pill${!localShowTimer ? ' active' : ''}`} onClick={() => setLocalShowTimer(false)}>Hide</button>
                {localShowTimer && <button type="button" className="disp-ctrl-pill" onClick={resetTimer}>Reset</button>}
              </div>
            </div>
            <div className="disp-ctrl-group disp-ctrl-group--view">
              <div className="disp-ctrl-label">View</div>
              <div className="disp-ctrl-pills">
                <button type="button" className={`disp-ctrl-pill${!isGuided ? ' active' : ''}`} onClick={() => switchPresentationView('clean')}>Clean</button>
                <button type="button" className={`disp-ctrl-pill${isGuided ? ' active' : ''}`} onClick={() => switchPresentationView('guided')}>Guided</button>
              </div>
            </div>
            <button className="disp-ctrl-end" type="button" onClick={onExit}>End Projection</button>
          </div>
        )}
      </div>

      {/* ── TOP BAR ── */}
      <div className="disp-top" style={{ background: style.topColor || cm.dark }}>
        <div>
          <div className="disp-class-name">{style.className}</div>
          <div className="disp-cat-label">{cm.emoji} {act?.cat}</div>
        </div>
        {localShowTimer && (
          <div className="disp-timer-group">
            <div className="disp-bar-wrap">
              <div className="disp-bar" style={{ width: pct + "%", background: style.accentColor }}/>
            </div>
            <div className="disp-timer-controls">
              <button className="disp-timer-button" type="button" onClick={() => setRunning(r => !r)} aria-label={running ? "Pause timer" : "Resume timer"}>
                <span className="disp-timer-num">{fmt(secs)}</span>
                <span className="disp-timer-action">{running ? "⏸ Pause" : "▶ Start"}</span>
              </button>
              <button className="disp-timer-reset" type="button" onClick={resetTimer} aria-label="Reset timer">↺</button>
            </div>
          </div>
        )}
      </div>

      {/* ── CONTENT ── */}
      <div className="disp-center">
        <div className="disp-prompt">{act?.prompt}</div>
        {localShowInstructions && act?.starter && (
          <div className="disp-starter-box">
            <div className="disp-starter-label">Sentence starter</div>
            <div className="disp-starter-text">"{act.starter}"</div>
          </div>
        )}
        {style.motto && <div className="disp-motto">{style.motto}</div>}
        {isGuided && (
          <div className="disp-guidance-panel">
            <div className="disp-guidance-title">Facilitation guidance</div>
            <div className="disp-guidance-text">{act?.directions || "Invite students to respond, listen, and connect before moving on."}</div>
            <div className="disp-guidance-supports">
              <span className="disp-guidance-chip">Read aloud</span>
              <span className="disp-guidance-chip">Simplify language</span>
              <span className="disp-guidance-chip">Watch pacing</span>
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM NAV ── */}
      <div className="disp-bottom">
        <button className={`disp-nav-btn disp-nav-prev${idx === 0 ? ' disp-nav-btn--hidden' : ''}`} type="button" onClick={() => setIdx(i => i - 1)} disabled={idx === 0}>
          ← Previous
        </button>
        <div className="disp-bottom-center">
          <div className="disp-activity-counter">Activity {idx + 1} of {routine.length}</div>
          <div className="disp-dots">
            {routine.map((item, i) => <div key={item?.id ?? i} className={"disp-dot" + (i === idx ? " curr" : "")}/>)}
          </div>
        </div>
        {idx < routine.length - 1
          ? <button className="disp-nav-btn disp-nav-next" type="button" onClick={() => setIdx(i => i + 1)}>Next →</button>
          : <button className="disp-nav-btn disp-nav-next disp-nav-done" type="button" onClick={onExit}>Done ✓</button>
        }
      </div>
    </div>
  );
}
