import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useTweaks, TweaksPanel, TweakSection, TweakSelect, TweakText } from './tweaks-panel';
import LandingPage from './LandingPage';
import PrivacyPage from './PrivacyPage';
import TermsPage from './TermsPage';
import DistrictPage from './DistrictPage';
import AuthScreen from './AuthScreen';
import DisplayMode from './DisplayMode';
import LessonSlideCreator from './LessonSlideCreator';
import LessonSlideDisplay from './LessonSlideDisplay';
import { CAT_META, MORNING_MEETING_CATS } from './lib/catMeta';
import {
  PROJECTOR_THEMES, THEME_BACKGROUND_PRESETS, PROJECTOR_BACKGROUNDS, DEFAULT_PROJECTOR_STYLE,
  normalizeColor, normalizeBackgroundUrl, isLikelyDirectImageUrl,
  getProjectorBackgroundImage, normalizeProjectorStyle, readProjectorStyle, persistProjectorStyle,
} from './lib/projector';
import {
  signOut as firebaseSignOut,
  sendEmailVerification,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  getRedirectResult,
} from 'firebase/auth';
import { auth, functions } from './lib/firebase';
import { createUserDocument, getUserDocument, saveDataSnapshot, loadDataSnapshot, migrateFromLocalStorage, fetchActivities, updateUserGrade, updateUserProfile, saveBehavioralExpectations } from './lib/firestore';
import { usePlan, FREE_LIMITS } from './lib/usePlan';
import { httpsCallable } from 'firebase/functions';

const tsToMs = ts => { if (typeof ts === 'number') return ts; return ts?.toMillis?.() ?? (ts?.seconds != null ? ts.seconds * 1000 : null); };
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "984386798513-aprar4ehdq87dd4jtguigupaiva0pnr5.apps.googleusercontent.com";
const LOGO_SRC = "/assets/ofthedaylogi.png";

const PROJECTOR_STATE_KEY = 'ofd:projectorState';
const SLIDE_PROJECTOR_KEY = 'ofd:slideProjectorState';

function LessonSlideReceiver() {
  const [slide, setSlide] = React.useState(() => {
    try { const r = localStorage.getItem(SLIDE_PROJECTOR_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
  });
  React.useEffect(() => {
    const onStorage = e => {
      if (e.key !== SLIDE_PROJECTOR_KEY) return;
      try { setSlide(e.newValue ? JSON.parse(e.newValue) : null); } catch {}
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  if (!slide) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#0A0F1E', color:'rgba(255,255,255,0.4)', fontFamily:'Outfit,sans-serif', fontSize:18 }}>
      Waiting for slide projection…
    </div>
  );
  return <LessonSlideDisplay slide={slide} projectorMode onExit={() => window.close()} />;
}

function ProjectorReceiver() {
  const [state, setState] = React.useState(() => {
    try { const raw = localStorage.getItem(PROJECTOR_STATE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
  });
  React.useEffect(() => {
    const onStorage = e => {
      if (e.key !== PROJECTOR_STATE_KEY) return;
      try { setState(e.newValue ? JSON.parse(e.newValue) : null); } catch {}
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  if (!state?.active) {
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0A0F1E',color:'rgba(255,255,255,0.4)',fontFamily:'Outfit,sans-serif',fontSize:'18px'}}>
        Waiting for projection to start…
      </div>
    );
  }
  return (
    <DisplayMode
      routine={state.routine}
      startIndex={state.startIndex ?? 0}
      projectorStyle={state.projectorStyle}
      initialView={state.presentationView ?? 'clean'}
      onExit={() => window.close()}
    />
  );
}

const FREE_ACTIVITY_LIMIT = 3;
function getAvailableActivities(activities, type, userTier) {
  const catActivities = activities.filter(a => a.cat === type);
  if (userTier === 'pro' || MORNING_MEETING_CATS.has(type)) return catActivities;
  return catActivities.slice(0, FREE_ACTIVITY_LIMIT);
}

const POOL = [
  { id:1,  cat:"Greeting",       title:"Would You Rather Welcome",      meta:"2 min · Low",    time:120, prompt:"Would you rather have the power to fly or be invisible? Share with someone near you!", starter:"I would rather… because…",          directions:"Students pair up and share with a reason. Give 60 sec, then hear 2–3 pairs." },
  { id:2,  cat:"Greeting",       title:"Two Truths and a Tall Tale",    meta:"3 min · Medium", time:180, prompt:"Share two true things and one made-up thing about your weekend.",                  starter:"One true thing about my weekend was…", directions:"Go around the room; class guesses which is the tall tale." },
  { id:3,  cat:"Greeting",       title:"Rose, Bud, Thorn",              meta:"3 min · Calm",   time:180, prompt:"Share one highlight, one thing you're looking forward to, and one challenge.",     starter:"My rose is… my bud is… my thorn is…",  directions:"Model your own first to set the tone." },
  { id:4,  cat:"Greeting",       title:"High-Five Check-In",            meta:"2 min · Low",    time:120, prompt:"On a scale of 1–5 fingers, how are you feeling right now? Show me!",               starter:"I'm at a… because…",                   directions:"Students hold up fingers, then turn and share their number with a partner." },
  { id:5,  cat:"SEL Prompt",     title:"What helped you this week?",    meta:"3 min · Calm",   time:180, prompt:"What is one thing that helped you feel successful this week?",                     starter:"One thing that helped me was…",         directions:"Ask students to think silently first, then turn and talk with a partner." },
  { id:6,  cat:"SEL Prompt",     title:"When I feel overwhelmed I…",    meta:"3 min · Calm",   time:180, prompt:"Describe one strategy you use when school feels like a lot.",                      starter:"When I feel overwhelmed, I usually…",   directions:"Normalize struggle before sharing. Avoid calling on students cold." },
  { id:7,  cat:"SEL Prompt",     title:"Something I'm proud of",        meta:"2 min · Calm",   time:120, prompt:"Name something you did recently that you feel good about — big or small.",         starter:"I'm proud that I…",                    directions:"Remind students that small wins count. Celebrate specifics." },
  { id:8,  cat:"SEL Prompt",     title:"One Word Check-In",             meta:"2 min · Low",    time:120, prompt:"If you had to describe how you're feeling with just one word, what would it be?",  starter:"My word is… because…",                 directions:"Quick whip-around the room. Accept all answers without judgment." },
  { id:9,  cat:"Brain Teaser",   title:"The Mystery Number",            meta:"5 min · Medium", time:300, prompt:"I am a two-digit number. My tens digit is 3 more than my ones digit. My digits add up to 9. What am I?", starter:"I think the answer is… because…", directions:"Give students 2 min alone, then open discussion. Ask for reasoning, not just answers." },
  { id:10, cat:"Brain Teaser",   title:"Word Ladder",                   meta:"5 min · Medium", time:300, prompt:"Change COLD to WARM in four steps — change only one letter at a time. Each step must be a real word.", starter:"My first step is…",          directions:"Allow partners. Hint: CORD is one of the steps." },
  { id:11, cat:"Brain Teaser",   title:"The Three Switches",            meta:"5 min · Medium", time:300, prompt:"Three switches control three light bulbs inside a room. You can flip switches but only enter the room once. How do you figure out which switch controls which bulb?", starter:"My plan is to…", directions:"Let students discuss in pairs before class share-out." },
  { id:12, cat:"Brain Teaser",   title:"Pattern Predictor",             meta:"4 min · Medium", time:240, prompt:"What comes next? 2, 6, 12, 20, 30, ___. Can you explain the rule?",               starter:"The next number is… because…",          directions:"Students write their answer and rule before sharing." },
  { id:13, cat:"Movement Break", title:"Four Corners",                  meta:"3 min · Active", time:180, prompt:"Each corner of the room is labeled A, B, C, or D. Move to the corner that matches your answer!", starter:"I chose corner… because…", directions:"Read a question aloud; students move to their answer corner and briefly discuss." },
  { id:14, cat:"Movement Break", title:"Mirror Stretch",                meta:"2 min · Calm",   time:120, prompt:"Face a partner and take turns leading slow stretches. Your partner mirrors every move.", starter:"",                             directions:"Pairs stand facing each other. Leader moves slowly; switch every 30 seconds." },
  { id:15, cat:"Movement Break", title:"Simon Says Brain Edition",      meta:"4 min · Active", time:240, prompt:"Follow Simon's commands — but only if Simon says! Stay sharp.",                    starter:"",                                     directions:"Combine movement with a cognitive challenge: Simon says pat your head AND count back from 20." },
  { id:16, cat:"Mindfulness",    title:"54321 Grounding",               meta:"3 min · Calm",   time:180, prompt:"Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste.", starter:"Five things I can see are…", directions:"Guide slowly through each sense. Soft background music helps." },
  { id:17, cat:"Mindfulness",    title:"Box Breathing",                 meta:"2 min · Calm",   time:120, prompt:"Breathe in for 4 counts. Hold for 4. Out for 4. Hold for 4. Repeat.",              starter:"",                                     directions:"Model it with the class. Count aloud together for the first round." },
  { id:18, cat:"Mindfulness",    title:"Gratitude Snapshot",            meta:"3 min · Calm",   time:180, prompt:"Close your eyes and picture one thing you're grateful for right now. What does it look like? Feel like?", starter:"I'm grateful for… because…", directions:"Students can share or keep private. Both are valid." },
  {id:19,cat:"Greeting",title:"Partner Greeting Remix",meta:"3 min · Medium",time:180,prompt:"Greet a partner by name, then add one kind sentence or question before switching partners.",starter:"Good morning, ___. One thing I want to ask is...",directions:"Model a respectful greeting first. Students greet one partner, rotate, and repeat with a new question.",source:"Responsive Classroom Activity Ideas",sourceUrl:"https://www.responsiveclassroom.org/category/morning-meeting/activity-ideas/"},
  {id:20,cat:"Greeting",title:"Secret Handshake Hello",meta:"4 min · Active",time:240,prompt:"Create a silent two-step handshake with a partner, then use it to greet two other classmates.",starter:"Our handshake starts with...",directions:"Keep movements simple and school-appropriate. Invite pairs to teach their handshake to another pair.",source:"Responsive Classroom Activity Ideas",sourceUrl:"https://www.responsiveclassroom.org/category/morning-meeting/activity-ideas/"},
  {id:21,cat:"Greeting",title:"Greeting Choice Board",meta:"3 min · Low",time:180,prompt:"Choose a wave, fist bump, elbow tap, or verbal hello. Greet three classmates by name.",starter:"Good morning, ___!",directions:"Offer non-contact choices. Emphasize names, eye contact if comfortable, and a calm pace.",source:"Responsive Classroom Activity Ideas",sourceUrl:"https://www.responsiveclassroom.org/category/morning-meeting/activity-ideas/"},
  {id:22,cat:"SEL Prompt",title:"Favorite Season Reason",meta:"3 min · Calm",time:180,prompt:"Which season fits your mood today, and why?",starter:"Today feels like ___ because...",directions:"Give quiet think time first, then use partner sharing before inviting a few whole-class responses.",source:"Responsive Classroom Activity Ideas",sourceUrl:"https://www.responsiveclassroom.org/category/morning-meeting/activity-ideas/"},
  {id:23,cat:"SEL Prompt",title:"Book Memory Chain",meta:"4 min · Calm",time:240,prompt:"Share a book, story, or character you remember well. Why did it stick with you?",starter:"A story I remember is...",directions:"After sharing, ask partners to repeat back one detail they heard to practice careful listening.",source:"Responsive Classroom Activity Ideas",sourceUrl:"https://www.responsiveclassroom.org/category/morning-meeting/activity-ideas/"},
  {id:24,cat:"SEL Prompt",title:"Themed Share Round",meta:"4 min · Medium",time:240,prompt:"Today’s theme is “something that helps me learn.” Share one example and listen for patterns.",starter:"One thing that helps me learn is...",directions:"Choose a theme connected to your classroom goal. Close by naming two or three common themes students mentioned.",source:"Responsive Classroom Activity Ideas",sourceUrl:"https://www.responsiveclassroom.org/category/morning-meeting/activity-ideas/"},
  {id:25,cat:"SEL Prompt",title:"Skillful Commenting",meta:"4 min · Calm",time:240,prompt:"Practice responding to a classmate with a comment that adds on, asks more, or shows appreciation.",starter:"I want to add...",directions:"Teach three response stems: “I noticed,” “I wonder,” and “I appreciate.” Students practice in pairs.",source:"Responsive Classroom Activity Ideas",sourceUrl:"https://www.responsiveclassroom.org/category/morning-meeting/activity-ideas/"},
  {id:26,cat:"Brain Teaser",title:"Academic Skill Circle",meta:"5 min · Medium",time:300,prompt:"Pass a quick academic challenge around the circle: one fact, word, equation, or clue at a time.",starter:"My contribution is...",directions:"Choose a current topic. Keep turns short and allow students to pass once if needed.",source:"Responsive Classroom Activity Ideas",sourceUrl:"https://www.responsiveclassroom.org/category/morning-meeting/activity-ideas/"},
  {id:27,cat:"Brain Teaser",title:"Science Noticing Share",meta:"5 min · Medium",time:300,prompt:"Look closely at an object, image, or question. Share one observation and one wondering.",starter:"I notice... I wonder...",directions:"Use any simple classroom object or projected image. Separate observations from guesses.",source:"Responsive Classroom Activity Ideas",sourceUrl:"https://www.responsiveclassroom.org/category/morning-meeting/activity-ideas/"},
  {id:28,cat:"Brain Teaser",title:"Responsibility Word Builder",meta:"4 min · Medium",time:240,prompt:"Choose a responsibility word like respect, effort, or care. Give an example of what it looks like today.",starter:"Today, ___ looks like...",directions:"Write the word where everyone can see it. Collect concrete examples and connect them to the day’s work.",source:"Responsive Classroom Activity Ideas",sourceUrl:"https://www.responsiveclassroom.org/category/morning-meeting/activity-ideas/"},
  {id:29,cat:"Movement Break",title:"Restless Reset Choices",meta:"3 min · Active",time:180,prompt:"Choose one reset: stretch tall, wall push, chair squeeze, or slow shoulder roll. Notice how your body feels after.",starter:"The reset that helped me was...",directions:"Offer choices so students can regulate without calling attention to themselves. Keep the tone calm and matter-of-fact.",source:"Responsive Classroom Activity Ideas",sourceUrl:"https://www.responsiveclassroom.org/category/morning-meeting/activity-ideas/"},
  {id:30,cat:"Movement Break",title:"Encore Pattern",meta:"4 min · Active",time:240,prompt:"Copy a short clap, snap, or movement pattern. When the class gets it, call “Encore!” and try a harder one.",starter:"The pattern I noticed was...",directions:"Start with a two-part pattern. Invite students to lead only after expectations are clear.",source:"Responsive Classroom Activity Ideas",sourceUrl:"https://www.responsiveclassroom.org/category/morning-meeting/activity-ideas/"},
  {id:31,cat:"Movement Break",title:"Imagination Walk",meta:"4 min · Active",time:240,prompt:"Move around the room as if you are walking through mud, snow, moon dust, or a quiet library.",starter:"I imagined...",directions:"Name one setting at a time. Students move safely, then freeze and describe what they imagined.",source:"Responsive Classroom Activity Ideas",sourceUrl:"https://www.responsiveclassroom.org/category/morning-meeting/activity-ideas/"},
  {id:32,cat:"Mindfulness",title:"Calm Greeting Breath",meta:"2 min · Calm",time:120,prompt:"Before greeting someone, take one slow breath in and out. Then say hello in a calm voice.",starter:"A calm greeting sounds like...",directions:"Use this when greetings have become too silly or rushed. Practice the breath, then the greeting.",source:"Responsive Classroom Activity Ideas",sourceUrl:"https://www.responsiveclassroom.org/category/morning-meeting/activity-ideas/"},
  {id:33,cat:"Greeting",title:"ELL-Friendly Hello",meta:"3 min · Low",time:180,prompt:"Practice a short greeting with a gesture, a name, and an optional language from home.",starter:"Hello, ___. I’m glad you’re here.",directions:"Display the sentence frame. Allow students to use home languages or gestures without requiring public translation.",source:"Responsive Classroom Activity Ideas",sourceUrl:"https://www.responsiveclassroom.org/category/morning-meeting/activity-ideas/"},
  {id:34,cat:"SEL Prompt",title:"Holiday Choice Share",meta:"4 min · Calm",time:240,prompt:"Share a tradition, food, song, quiet day, or family routine that matters to you, or share something you prefer not to celebrate.",starter:"One tradition or routine in my life is...",directions:"Keep the prompt inclusive and optional. Students may share a non-holiday routine if that feels better.",source:"Responsive Classroom Activity Ideas",sourceUrl:"https://www.responsiveclassroom.org/category/morning-meeting/activity-ideas/"},
  {id:101,cat:"Sharing",title:"Favorite Season Reason",meta:"3 min · Calm",time:180,prompt:"Which season fits your mood today, and why?",starter:"Today feels like ___ because...",directions:"Give quiet think time first. Students share with a partner, then invite two or three volunteers to share with the class.",source:"Responsive Classroom Activity Ideas",sourceUrl:"https://www.responsiveclassroom.org/category/morning-meeting/activity-ideas/"},
  {id:102,cat:"Sharing",title:"Book Memory Chain",meta:"4 min · Calm",time:240,prompt:"Share a book, story, or character you remember well. Why did it stick with you?",starter:"A story I remember is...",directions:"After sharing, partners repeat back one detail they heard to practice careful listening and responding.",source:"Responsive Classroom Activity Ideas",sourceUrl:"https://www.responsiveclassroom.org/category/morning-meeting/activity-ideas/"},
  {id:103,cat:"Sharing",title:"Themed Share Round",meta:"4 min · Medium",time:240,prompt:"Today’s theme is something that helps me learn. Share one example and listen for patterns.",starter:"One thing that helps me learn is...",directions:"Choose a theme connected to your classroom goal. Close by naming two or three common patterns students mentioned.",source:"Responsive Classroom Activity Ideas",sourceUrl:"https://www.responsiveclassroom.org/category/morning-meeting/activity-ideas/"},
  {id:104,cat:"Sharing",title:"Skillful Commenting",meta:"4 min · Calm",time:240,prompt:"Practice responding to a classmate with a comment that adds on, asks more, or shows appreciation.",starter:"I want to add...",directions:"Teach three response stems: I noticed, I wonder, and I appreciate. Students practice in pairs before whole-group sharing.",source:"Responsive Classroom Activity Ideas",sourceUrl:"https://www.responsiveclassroom.org/category/morning-meeting/activity-ideas/"},
  {id:201,cat:"Sharing",title:"School Bright Spot",meta:"3 min · Calm",time:180,prompt:"What is one part of school that usually helps you feel ready to learn?",starter:"One part of school that helps me is...",directions:"Use a quick think-pair-share. Encourage students to name people, places, routines, or subjects.",source:"Centervention Morning Meeting Questions",sourceUrl:"https://www.centervention.com/morning-meeting-questions/"},
  {id:202,cat:"Sharing",title:"Proud Moment Share",meta:"3 min · Calm",time:180,prompt:"What is something you have done recently that made you feel proud?",starter:"I felt proud when...",directions:"Give examples of academic, social, and personal wins so students know small moments count.",source:"Centervention Morning Meeting Questions",sourceUrl:"https://www.centervention.com/morning-meeting-questions/"},
  {id:203,cat:"Sharing",title:"Future Me",meta:"4 min · Calm",time:240,prompt:"When you imagine yourself in the future, what is one thing you hope you are doing?",starter:"In the future, I hope I am...",directions:"Students may answer seriously or creatively. Invite partners to ask one follow-up question.",source:"Centervention Morning Meeting Questions",sourceUrl:"https://www.centervention.com/morning-meeting-questions/"},
  {id:204,cat:"Sharing",title:"Cheer-Up Choice",meta:"3 min · Calm",time:180,prompt:"What is one safe, kind thing that helps you cheer yourself up on a hard day?",starter:"Something that helps me is...",directions:"Keep the focus on healthy strategies. Build a quick class list of helpful choices.",source:"Centervention Morning Meeting Questions",sourceUrl:"https://www.centervention.com/morning-meeting-questions/"},
  {id:205,cat:"Sharing",title:"Admire and Explain",meta:"4 min · Calm",time:240,prompt:"Think of someone you admire. What is one quality they show that you respect?",starter:"I admire ___ because...",directions:"Students can name a real person, character, or public figure. Emphasize qualities, not popularity.",source:"Centervention Morning Meeting Questions",sourceUrl:"https://www.centervention.com/morning-meeting-questions/"},
  {id:206,cat:"Sharing",title:"After-School Joy",meta:"3 min · Calm",time:180,prompt:"What is something you enjoy doing when school is over, and what do you like about it?",starter:"After school, I like to...",directions:"Use partner sharing first so every student gets a voice before volunteers share out.",source:"Centervention Morning Meeting Questions",sourceUrl:"https://www.centervention.com/morning-meeting-questions/"},
  {id:207,cat:"Sharing",title:"Dream Trip",meta:"4 min · Medium",time:240,prompt:"If our class could take an imaginary trip anywhere, where should we go and why?",starter:"I would take the class to...",directions:"Invite students to include one detail: something they would see, learn, taste, or try.",source:"Centervention Morning Meeting Questions",sourceUrl:"https://www.centervention.com/morning-meeting-questions/"},
  {id:208,cat:"Sharing",title:"Superpower for Good",meta:"3 min · Medium",time:180,prompt:"If you could choose one superpower to help people, what would it be?",starter:"I would choose... because...",directions:"After sharing, ask students how they can show a tiny version of that power today.",source:"Centervention Morning Meeting Questions",sourceUrl:"https://www.centervention.com/morning-meeting-questions/"},
  {id:209,cat:"Sharing",title:"Invent a Helpful App",meta:"4 min · Medium",time:240,prompt:"If you could design an app that solved one everyday problem, what would it do?",starter:"My app would help people...",directions:"Great for grades 6 and up. Invite students to name the problem, user, and first button.",source:"Centervention Morning Meeting Questions",sourceUrl:"https://www.centervention.com/morning-meeting-questions/"},
  {id:210,cat:"Sharing",title:"One Rule for a Better Day",meta:"4 min · Calm",time:240,prompt:"If you could add one rule that would make school better for everyone, what would it be?",starter:"One helpful rule would be...",directions:"Guide students toward rules that are fair, realistic, and community-minded.",source:"Centervention Morning Meeting Questions",sourceUrl:"https://www.centervention.com/morning-meeting-questions/"},
  {id:211,cat:"Sharing",title:"Novel Title About You",meta:"3 min · Calm",time:180,prompt:"If a book were written about your week, what would the title be?",starter:"The title would be...",directions:"Students can answer with humor or honesty. Invite one sentence explaining the title.",source:"Centervention Morning Meeting Questions",sourceUrl:"https://www.centervention.com/morning-meeting-questions/"},
  {id:212,cat:"Sharing",title:"Hidden Strength",meta:"4 min · Calm",time:240,prompt:"What is something you are good at that classmates might not know yet?",starter:"Something people may not know is...",directions:"Model a low-pressure answer first. Students may share a skill, interest, responsibility, or kindness.",source:"Centervention Morning Meeting Questions",sourceUrl:"https://www.centervention.com/morning-meeting-questions/"},
  {id:213,cat:"Sharing",title:"Past or Future Visit",meta:"4 min · Medium",time:240,prompt:"Would you rather visit a time long ago or a time far in the future? What would you want to see?",starter:"I would visit... because...",directions:"Students choose a side, then share one detail they would investigate.",source:"Centervention Morning Meeting Questions",sourceUrl:"https://www.centervention.com/morning-meeting-questions/"},
  {id:214,cat:"Sharing",title:"Hard Goal, First Step",meta:"4 min · Calm",time:240,prompt:"What is one goal that may take real effort, and what is one small first step?",starter:"A goal that will take effort is...",directions:"Keep the tone supportive. Close by naming how small steps make hard goals feel possible.",source:"Centervention Morning Meeting Questions",sourceUrl:"https://www.centervention.com/morning-meeting-questions/"},
  {id:111,cat:"Group Activity",title:"Encore Pattern",meta:"4 min · Active",time:240,prompt:"Copy a short clap, snap, or movement pattern. When the class gets it, call Encore and try a harder one.",starter:"The pattern I noticed was...",directions:"Start with a two-part pattern. Invite students to lead only after expectations are clear and the pace is safe.",source:"Responsive Classroom Activity Ideas",sourceUrl:"https://www.responsiveclassroom.org/category/morning-meeting/activity-ideas/"},
  {id:112,cat:"Group Activity",title:"Academic Skill Circle",meta:"5 min · Medium",time:300,prompt:"Pass a quick academic challenge around the circle: one fact, word, equation, or clue at a time.",starter:"My contribution is...",directions:"Choose a current topic. Keep turns short and allow students to pass once if needed.",source:"Responsive Classroom Activity Ideas",sourceUrl:"https://www.responsiveclassroom.org/category/morning-meeting/activity-ideas/"},
  {id:113,cat:"Group Activity",title:"Imagination Walk",meta:"4 min · Active",time:240,prompt:"Move around the room as if you are walking through mud, snow, moon dust, or a quiet library.",starter:"I imagined...",directions:"Name one setting at a time. Students move safely, then freeze and describe what they imagined.",source:"Responsive Classroom Activity Ideas",sourceUrl:"https://www.responsiveclassroom.org/category/morning-meeting/activity-ideas/"},
  {id:114,cat:"Group Activity",title:"Science Noticing Share",meta:"5 min · Medium",time:300,prompt:"Look closely at an object, image, or question. Share one observation and one wondering.",starter:"I notice... I wonder...",directions:"Use any simple classroom object or projected image. Separate observations from guesses.",source:"Responsive Classroom Activity Ideas",sourceUrl:"https://www.responsiveclassroom.org/category/morning-meeting/activity-ideas/"},
  {id:121,cat:"Morning Message",title:"Good Morning, Learners",meta:"2 min · Calm",time:120,prompt:"Good morning, learners. Today we will build our classroom community by listening carefully and helping each other begin well.",starter:"One way I can help our class today is...",directions:"Display the message as students enter. Read it together and ask students to name one action that will help the class start strong.",source:"Responsive Classroom Meeting",sourceUrl:"https://www.responsiveclassroom.org/morning-meeting-components/"},
  {id:122,cat:"Morning Message",title:"Responsibility Word Builder",meta:"3 min · Medium",time:180,prompt:"Today’s responsibility word is effort. What does effort look like, sound like, and feel like in our classroom?",starter:"Today, effort looks like...",directions:"Write the word where everyone can see it. Collect concrete examples and connect them to the day’s first lesson.",source:"Responsive Classroom Activity Ideas",sourceUrl:"https://www.responsiveclassroom.org/category/morning-meeting/activity-ideas/"},
  {id:123,cat:"Morning Message",title:"Community Goal Message",meta:"2 min · Calm",time:120,prompt:"Today our goal is to make sure every classmate feels included. What is one small move that helps someone feel like they belong?",starter:"One small move is...",directions:"Read the message chorally. Students turn and talk, then choose one class goal to practice before lunch.",source:"Responsive Classroom Meeting",sourceUrl:"https://www.responsiveclassroom.org/morning-meeting-components/"},
  {id:124,cat:"Morning Message",title:"Preview the Learning Day",meta:"3 min · Calm",time:180,prompt:"Today we will read, solve, create, and reflect. Which part of the day will need the most perseverance?",starter:"I may need perseverance when...",directions:"Use the message to preview the day. Invite students to identify one moment where a learning strategy will help.",source:"Responsive Classroom Meeting",sourceUrl:"https://www.responsiveclassroom.org/morning-meeting-components/"}
];

const DEFAULT_CATS = ["Greeting", "Sharing", "Group Activity", "Morning Message"];
const GRADE_RITUAL_ACTIVITY_IDS = {
  "K–2": new Set([1,4,19,21,32,33,101,201,202,204,206,207,208,30,31,111,113,121,123]),
  "3–5": new Set([1,2,3,4,19,20,21,33,101,102,103,104,201,202,203,204,205,206,207,208,210,212,214,26,27,28,30,31,111,112,113,114,121,122,123,124]),
  "6–8": new Set([1,2,3,19,20,102,103,104,203,205,207,208,209,210,211,212,213,214,26,27,28,30,111,112,114,122,123,124]),
  "9–12": new Set([2,3,19,103,104,203,205,209,210,211,212,213,214,26,27,28,112,114,122,123,124])
};
const TIME_LIMITS = { "5 min": 300, "10 min": 600, "15 min": 900, "20+ min": Infinity };
const VOCAB_SOURCE = {
  name: "Vocabulary Ninja Word of the Day",
  url: "https://vocabularyninja.co.uk/word-of-the-day/"
};

const ON_THIS_DAY_SOURCE = {
  name: "OnThisDay.com",
  url: "https://www.onthisday.com/"
};

const ON_THIS_DAY_FALLBACK = {
  "01-01": [
    { year: "1892", title: "Ellis Island opened in New York Harbor. Millions of people later came through this station when moving to the United States.", category: "History" },
    { year: "1801", title: "Giuseppe Piazzi discovered Ceres, the largest object in the asteroid belt between Mars and Jupiter.", category: "Space" },
    { year: "1863", title: "The Emancipation Proclamation took effect. It became an important step toward freedom in the United States.", category: "Civics" }
  ],
  "02-01": [
    { year: "1960", title: "Four college students began a peaceful sit-in in Greensboro, North Carolina. Their courage helped more people work for fair treatment.", category: "Civics" },
    { year: "1884", title: "The first part of the Oxford English Dictionary was published, helping people learn about words and their histories.", category: "Language" },
    { year: "2003", title: "NASA learned important safety lessons from the Space Shuttle Columbia mission.", category: "Space" }
  ],
  "03-14": [
    { year: "1879", title: "Albert Einstein was born. He became famous for asking big questions about light, energy, space, and time.", category: "Science" },
    { year: "1988", title: "Pi Day was first celebrated at the Exploratorium in San Francisco. Pi helps people measure circles.", category: "Math" },
    { year: "1995", title: "Astronaut Norman Thagard became the first American to ride to space on a Russian spacecraft.", category: "Space" }
  ],
  "04-22": [
    { year: "1970", title: "The first Earth Day was celebrated. People used the day to learn how to protect air, water, animals, and land.", category: "Nature" },
    { year: "1838", title: "The steamship Sirius completed an early trip across the Atlantic Ocean using steam power.", category: "Transportation" },
    { year: "1993", title: "The first web browser for many home computers helped more people explore the World Wide Web.", category: "Technology" }
  ],
  "04-30": [
    { year: "1789", title: "George Washington became the first president of the United States. Students can ask what makes a good leader.", category: "Civics" },
    { year: "1993", title: "CERN shared World Wide Web technology for anyone to use freely, helping the internet grow.", category: "Technology" },
    { year: "1803", title: "The Louisiana Purchase doubled the size of the United States and changed maps of North America.", category: "Geography" }
  ],
  "05-05": [
    { year: "1961", title: "Alan Shepard became the first American to travel into space. His short flight helped NASA learn more about human space travel.", category: "Space" },
    { year: "1862", title: "The Battle of Puebla later became connected to Cinco de Mayo, a celebration of Mexican history and culture.", category: "Culture" },
    { year: "1904", title: "Cy Young pitched baseball's first perfect game in the modern era.", category: "Sports" }
  ],
  "06-19": [
    { year: "1865", title: "Juneteenth marks the day many enslaved people in Texas learned they were free.", category: "Civics" },
    { year: "2021", title: "Juneteenth became a federal holiday in the United States.", category: "Civics" },
    { year: "1978", title: "The comic strip Garfield first appeared in newspapers.", category: "Arts & Culture" }
  ],
  "07-20": [
    { year: "1969", title: "Apollo 11 astronauts Neil Armstrong and Buzz Aldrin walked on the Moon.", category: "Space" },
    { year: "1976", title: "NASA's Viking 1 lander reached Mars and sent pictures back to Earth.", category: "Space" },
    { year: "1940", title: "The first Billboard music popularity chart was published.", category: "Arts & Culture" }
  ],
  "08-28": [
    { year: "1963", title: "Martin Luther King Jr. shared his famous dream for fairness during the March on Washington.", category: "Civics" },
    { year: "1993", title: "The Galileo spacecraft flew by an asteroid named Ida and discovered it had a tiny moon.", category: "Space" },
    { year: "1907", title: "UPS began as a small messenger company in Seattle before growing into a worldwide delivery service.", category: "Inventions" }
  ],
  "09-17": [
    { year: "1787", title: "Delegates signed the United States Constitution in Philadelphia.", category: "Civics" },
    { year: "1976", title: "NASA publicly introduced the first space shuttle, Enterprise.", category: "Space" },
    { year: "1920", title: "The National Football League began as a small group of teams.", category: "Sports" }
  ],
  "10-04": [
    { year: "1957", title: "Sputnik 1 became the first artificial satellite to orbit Earth.", category: "Space" },
    { year: "1822", title: "Rutherford B. Hayes was born. He later became the 19th U.S. president.", category: "Famous People" },
    { year: "1535", title: "The first complete English Bible was printed, helping more people read it in English.", category: "Language" }
  ],
  "11-09": [
    { year: "1989", title: "The Berlin Wall opened. Families and friends who had been separated could visit each other again.", category: "History" },
    { year: "1967", title: "The first issue of Rolling Stone magazine was published, sharing stories about music and culture.", category: "Arts & Culture" },
    { year: "1934", title: "Astronomer Carl Sagan was born. He helped many people get excited about space.", category: "Space" }
  ],
  "12-10": [
    { year: "1901", title: "The first Nobel Prizes were awarded to people who made important contributions to the world.", category: "Science" },
    { year: "1948", title: "The United Nations adopted the Universal Declaration of Human Rights.", category: "Civics" },
    { year: "1815", title: "Ada Lovelace was born. She is remembered for early ideas about computer programming.", category: "Technology" }
  ],
  default: [
    { year: "1969", title: "Apollo 11 astronauts walked on the Moon. What do you think teamwork sounded like during the mission?", category: "Space" },
    { year: "1970", title: "Earth Day began as a way for people to learn how to protect nature and the planet.", category: "Nature" },
    { year: "1903", title: "The Wright brothers made one of the first powered airplane flights. It lasted less than a minute.", category: "Inventions" },
    { year: "1934", title: "Jane Goodall was born. She later studied chimpanzees and taught people to care about animals.", category: "Animals" },
    { year: "1955", title: "Marian Anderson became the first Black singer to perform with the Metropolitan Opera.", category: "Arts & Culture" },
    { year: "1947", title: "Jackie Robinson joined Major League Baseball and helped professional sports become more fair.", category: "Sports" },
    { year: "1990", title: "The Hubble Space Telescope launched and began helping people see deep into space.", category: "Space" },
    { year: "1958", title: "LEGO bricks began using their modern interlocking design, making creative building easier.", category: "Inventions" }
  ]
};

const ELEMENTARY_ON_THIS_DAY = {
  "K–2": [
    { year: "1934", title: "Jane Goodall was born. She grew up loving animals and later studied chimpanzees.", category: "Animals", prompt: "What animal would you like to learn more about?" },
    { year: "1958", title: "LEGO bricks began using their modern snap-together design.", category: "Inventions", prompt: "What would you build if you had unlimited bricks?" },
    { year: "1969", title: "Astronauts walked on the Moon for the first time.", category: "Space", prompt: "What would you want to see on the Moon?" },
    { year: "1970", title: "Earth Day began so people could learn how to take care of our planet.", category: "Nature", prompt: "What is one way our class can help the Earth?" },
    { year: "1903", title: "The Wright brothers flew an early airplane for less than one minute.", category: "Inventions", prompt: "Why do you think trying again matters?" },
    { year: "1990", title: "The Hubble Space Telescope went to space and began taking pictures of stars and galaxies.", category: "Space", prompt: "What do you wonder about space?" },
    { year: "1947", title: "Jackie Robinson helped make baseball more fair for everyone.", category: "Sports", prompt: "What does fairness look like in a game?" },
    { year: "1983", title: "Sally Ride became the first American woman to travel into space.", category: "Space", prompt: "What brave thing might an astronaut need to do?" }
  ],
  "3–5": [
    { year: "1888", title: "The National Geographic Society was founded to help people learn about maps, animals, cultures, and Earth.", category: "Geography", prompt: "What place, animal, or culture would you like to investigate?" },
    { year: "1876", title: "Alexander Graham Bell received a patent for the telephone, helping people talk across long distances.", category: "Inventions", prompt: "How did phones change the way people communicate?" },
    { year: "1962", title: "Mae Jemison was born. She later became the first Black woman to travel into space.", category: "Famous People", prompt: "What character trait helps someone do something new?" },
    { year: "1928", title: "Alexander Fleming noticed something that helped lead to penicillin, an important medicine.", category: "Science", prompt: "Why is careful observation important in science?" },
    { year: "1914", title: "Garrett Morgan patented safety equipment that helped protect rescue workers.", category: "Inventions", prompt: "What problem would you invent something to solve?" },
    { year: "1869", title: "The first U.S. transcontinental railroad helped people and goods travel across the country faster.", category: "Transportation", prompt: "How does transportation change communities?" },
    { year: "1706", title: "Benjamin Franklin was born. He became a writer, inventor, scientist, and leader.", category: "Famous People", prompt: "Why might curiosity help someone learn many things?" },
    { year: "1901", title: "The first Nobel Prizes honored people whose work helped the world.", category: "Science", prompt: "What kind of helpful work should be celebrated?" }
  ]
};

function rotateHistoryItems(items, date = new Date(), count = 6) {
  if (!items.length) return [];
  const start = ((date.getMonth() + 1) * 13 + date.getDate()) % items.length;
  return Array.from({ length: Math.min(count, items.length) }, (_, i) => items[(start + i) % items.length]);
}

function getGradeHistoryItems(grade = "3–5", liveItems = [], date = new Date()) {
  const band = gradeToBand(grade);
  if (band === "K–2") return rotateHistoryItems(ELEMENTARY_ON_THIS_DAY["K–2"], date, 5);
  if (band === "3–5") return rotateHistoryItems(ELEMENTARY_ON_THIS_DAY["3–5"], date, 6);
  const fallback = getFallbackHistory(date);
  if (band === "6–8") {
    const middle = [...liveItems, ...fallback].filter(item => !/treaty|monastic|papal|conquer|condemned|heretic/i.test(item.title || ""));
    return middle.length ? middle.slice(0, 8) : fallback;
  }
  return liveItems.length ? liveItems.slice(0, 10) : fallback;
}

function dateKeyFromDate(date = new Date()) {
  return String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
}

function onThisDayUrl(date = new Date()) {
  const months = ["january","february","march","april","may","june","july","august","september","october","november","december"];
  return `https://www.onthisday.com/events/${months[date.getMonth()]}/${date.getDate()}`;
}

function getFallbackHistory(date = new Date()) {
  return ON_THIS_DAY_FALLBACK[dateKeyFromDate(date)] || ON_THIS_DAY_FALLBACK.default;
}

function historyPrompt(item) {
  return item?.prompt || "What connection can you make between this moment and our classroom, community, or world today?";
}

function historyToActivity(item, sourceUrl) {
  return {
    id: `history-${item.year}-${encodeURIComponent(item.title)}`,
    cat: "On This Day",
    title: `On This Day: ${item.year}`,
    meta: "4 min · Calm",
    time: 240,
    prompt: `${item.year}: ${item.title}`,
    starter: historyPrompt(item),
    directions: "Invite students to notice, wonder, and connect this historical moment to something they know.",
    source: ON_THIS_DAY_SOURCE.name,
    sourceUrl: sourceUrl || ON_THIS_DAY_SOURCE.url
  };
}

const DO_NOW_MATH = {
  "K–2": [
    { title:"Count and Compare", problem:"Which is greater: 14 or 17? How do you know?", hint:"Use a number line or count forward from 14.", answer:"17 is greater because it comes after 14 when counting.", teacherNote:"Listen for students using order, counting, or place-value language." },
    { title:"Missing Addend", problem:"5 + ___ = 9. What number is missing?", hint:"Count up from 5 to 9.", answer:"4 is missing because 5 + 4 = 9.", teacherNote:"Ask students to show the count-up strategy on fingers or drawings." },
    { title:"Shape Hunt", problem:"Name a shape with 3 sides. Where do you see one in the room?", hint:"Count the sides and corners.", answer:"A triangle has 3 sides.", teacherNote:"Accept real-world examples if students can justify the shape." },
    { title:"Ten Frame Think", problem:"You have 8 counters. How many more do you need to make 10?", hint:"Think 8 and what makes 10?", answer:"2 more counters make 10.", teacherNote:"Connect to complements of ten." }
  ],
  "3–5": [
    { title:"Fraction Match", problem:"Which is larger: 1/2 or 3/8? Explain your reasoning.", hint:"Compare both fractions to 4/8.", answer:"1/2 is larger because 1/2 = 4/8, and 4/8 > 3/8.", teacherNote:"Look for equivalent fraction reasoning, not just an answer." },
    { title:"Place Value Puzzle", problem:"A number has 6 hundreds, 4 tens, and 9 ones. What is the number?", hint:"Write the hundreds, tens, and ones in order.", answer:"649.", teacherNote:"Ask students to represent it in expanded form: 600 + 40 + 9." },
    { title:"Multiply Efficiently", problem:"Solve 8 × 25 mentally. What strategy did you use?", hint:"25 is one quarter of 100.", answer:"200. One strategy: 4 × 25 = 100, so 8 × 25 = 200.", teacherNote:"Invite multiple strategies: doubling, grouping, or using 100." },
    { title:"Remainder Reasoning", problem:"23 students form groups of 4. How many full groups can they make, and how many students are left?", hint:"Think 4 × 5 and 4 × 6.", answer:"5 full groups with 3 students left.", teacherNote:"Connect the result to division with remainders." }
  ],
  "6–8": [
    { title:"Ratio Table", problem:"A recipe uses 3 cups of flour for every 2 cups of sugar. How much sugar is needed for 12 cups of flour?", hint:"3 cups of flour becomes 12 cups by multiplying by 4.", answer:"8 cups of sugar.", teacherNote:"Emphasize scaling both parts of the ratio by the same factor." },
    { title:"Integer Change", problem:"The temperature was -3°F and rose 11 degrees. What is the new temperature?", hint:"Move 11 spaces to the right from -3 on a number line.", answer:"8°F.", teacherNote:"Ask students to model the change with a number line." },
    { title:"Solve the Equation", problem:"Solve: 3x + 5 = 23.", hint:"Undo +5 first, then divide by 3.", answer:"x = 6.", teacherNote:"Look for inverse-operation reasoning." },
    { title:"Percent Quick Check", problem:"What is 15% of 80?", hint:"10% of 80 is 8, and 5% is half of that.", answer:"12.", teacherNote:"Encourage benchmark percent strategies." }
  ],
  "9–12": [
    { title:"Linear Function", problem:"A line has slope 3 and passes through (0, -2). Write its equation.", hint:"Use y = mx + b.", answer:"y = 3x - 2.", teacherNote:"Confirm students understand the y-intercept from (0, -2)." },
    { title:"Quadratic Roots", problem:"Solve x² - 9 = 0.", hint:"This is a difference of squares.", answer:"x = -3 or x = 3.", teacherNote:"Ask why both positive and negative values work." },
    { title:"Function Evaluation", problem:"If f(x) = 2x² - 1, what is f(3)?", hint:"Substitute 3 for x before simplifying.", answer:"17, because 2(3²) - 1 = 18 - 1.", teacherNote:"Watch order of operations." },
    { title:"Data Reasoning", problem:"A data set has mean 72. One low score of 40 is removed. Will the mean increase, decrease, or stay the same?", hint:"Think about whether 40 is below or above the mean.", answer:"The mean will increase because a below-average value was removed.", teacherNote:"Prioritize conceptual reasoning over calculation." }
  ]
};

const DO_NOW_WRITING = {
  "K–2": [
    { title:"Favorite Place", problem:"Write one sentence about a place you like to visit. Add one detail that helps us picture it.", hint:"Start with: I like to visit...", answer:"Student responses will vary.", teacherNote:"Inspired by early-grade place and personal-experience topics. Look for one clear idea and one concrete detail." },
    { title:"Animal Expert", problem:"Write two things you know about an animal.", hint:"Choose one animal. Tell what it looks like, eats, or does.", answer:"Student responses will vary.", teacherNote:"Builds explanatory writing from high-interest topics like animals and nature." },
    { title:"How To Help", problem:"Write one way people can help keep a classroom, playground, or neighborhood clean.", hint:"Use should or can.", answer:"Student responses will vary.", teacherNote:"A quick persuasive prompt with a real classroom/community connection." },
    { title:"Tiny Story", problem:"Write two sentences about a lost mitten.", hint:"Sentence 1: Who found it? Sentence 2: What happened next?", answer:"Student responses will vary.", teacherNote:"Encourage a clear beginning and ending." },
    { title:"What If Toys Talked?", problem:"Pick a toy. Write what it might say if it could talk.", hint:"Use quotation marks if students are ready.", answer:"Student responses will vary.", teacherNote:"Creative prompt adapted from imaginative early-grade topic patterns." },
    { title:"Book Friend", problem:"Name a character from a book. Write why you would or would not want to meet them.", hint:"Use because.", answer:"Student responses will vary.", teacherNote:"Short response-to-reading practice with opinion support." },
    { title:"Funny Words", problem:"Write a word that sounds funny to you. Tell why it makes you smile.", hint:"Try saying the word quietly first.", answer:"Student responses will vary.", teacherNote:"Good for phonological play and low-pressure writing fluency." },
    { title:"I Wonder", problem:"Write one question you wonder about animals, space, weather, or the ocean.", hint:"Start with: I wonder why... or I wonder how...", answer:"Student responses will vary.", teacherNote:"Seed research curiosity without requiring research time." }
  ],
  "3–5": [
    { title:"Best Recess Game", problem:"Explain how to play a recess or playground game so a new student could join.", hint:"Use steps like first, next, then.", answer:"Student responses will vary.", teacherNote:"Procedural/explanatory writing based on familiar school topics." },
    { title:"School Needs This", problem:"What is one thing our school really needs? Write your opinion and one strong reason.", hint:"Claim + because + example.", answer:"Student responses will vary.", teacherNote:"Persuasive writing with a concrete audience and purpose." },
    { title:"Special Photograph", problem:"Describe a photo you remember. What is happening, and why does it matter?", hint:"Include who, where, and one feeling.", answer:"Student responses will vary.", teacherNote:"Narrative-memory prompt inspired by personal photograph topics." },
    { title:"Invention Idea", problem:"Invent a machine that would solve a small everyday problem. What does it do?", hint:"Name the problem before describing the machine.", answer:"Student responses will vary.", teacherNote:"Creative/explanatory blend; useful before science or design thinking." },
    { title:"Ocean Question", problem:"Write one thing you know about the ocean and one question you could research.", hint:"Separate facts from questions.", answer:"Student responses will vary.", teacherNote:"Research readiness: fact/question distinction." },
    { title:"Author Move", problem:"Think about a book you like. What is one thing the author does well?", hint:"They might use funny dialogue, suspense, description, or strong characters.", answer:"Student responses will vary.", teacherNote:"Response-to-literature prompt that names craft." },
    { title:"Storm Moment", problem:"Write the first five sentences of a story that begins during a big storm.", hint:"Use sound, movement, and one character reaction.", answer:"Student responses will vary.", teacherNote:"Creative narrative with sensory detail." },
    { title:"Team Sports", problem:"Are team sports good for students? Give one reason for your answer.", hint:"You may agree, disagree, or partly agree.", answer:"Student responses will vary.", teacherNote:"Supports nuanced opinion writing." }
  ],
  "6–8": [
    { title:"New Student Guide", problem:"Write advice for a new student who wants to have a good first week here.", hint:"Give two specific tips and explain why they help.", answer:"Student responses will vary.", teacherNote:"Explanatory writing grounded in authentic audience." },
    { title:"Change School Life", problem:"What change would improve school life? Write a claim and two reasons.", hint:"Make the change realistic enough to discuss.", answer:"Student responses will vary.", teacherNote:"Argument writing inspired by school-improvement topic patterns." },
    { title:"Memorable Ride", problem:"Write about a bus, car, train, bike, or walking trip that you remember.", hint:"Focus on one moment instead of the whole trip.", answer:"Student responses will vary.", teacherNote:"Narrative practice with narrowing focus." },
    { title:"Future Self", problem:"Imagine meeting yourself five years from now. What question would you ask, and what answer might you hope to hear?", hint:"Make the answer reveal a goal or value.", answer:"Student responses will vary.", teacherNote:"Reflective/creative prompt adapted from future-self topics." },
    { title:"Book to Screen", problem:"Should a favorite book be made into a movie or show? Explain one opportunity and one risk.", hint:"Think about characters, setting, and what might change.", answer:"Student responses will vary.", teacherNote:"Response-to-literature plus argument." },
    { title:"Job Worth Trying", problem:"Choose a job you might like to try. What would you need to learn first?", hint:"Name a skill, habit, or responsibility.", answer:"Student responses will vary.", teacherNote:"Research/career writing in short form." },
    { title:"Rule Check", problem:"Is a rule always right just because it is a rule? Write a careful answer.", hint:"Use an example, but keep it respectful.", answer:"Student responses will vary.", teacherNote:"Good for civic reasoning and classroom norms." },
    { title:"Cloud People", problem:"Write a scene set in a community that lives above the clouds.", hint:"Include one ordinary detail and one impossible detail.", answer:"Student responses will vary.", teacherNote:"Creative prompt that invites world-building without a long setup." }
  ],
  "9–12": [
    { title:"Necessary Change", problem:"What is one change that would make school more meaningful for students? Write a claim, reason, and possible objection.", hint:"Acknowledge why someone might disagree.", answer:"Student responses will vary.", teacherNote:"Argument practice with counterargument." },
    { title:"Routine Breaker", problem:"What do you do, or wish you could do, to break routine? Explain what that reveals about you.", hint:"Move from action to reflection.", answer:"Student responses will vary.", teacherNote:"Personal essay seed drawn from self-reflection topic patterns." },
    { title:"Invention We Need", problem:"What invention would you like to see in your lifetime? Explain the problem it would solve.", hint:"Be specific about who benefits.", answer:"Student responses will vary.", teacherNote:"Explanatory/argument hybrid that can lead into research." },
    { title:"Meaningful Gift", problem:"Write about a meaningful gift you gave, received, or wish you could give.", hint:"The gift can be an object, time, advice, or help.", answer:"Student responses will vary.", teacherNote:"Narrative reflection with emotional specificity." },
    { title:"Color Meaning", problem:"Choose a color and explain what it means to you. Use one memory or image.", hint:"Avoid listing; build around one example.", answer:"Student responses will vary.", teacherNote:"Good mini-practice for symbolism and concrete detail." },
    { title:"Crime Stories", problem:"Why are people drawn to mystery or crime stories? Offer one explanation.", hint:"Consider suspense, justice, fear, puzzles, or character.", answer:"Student responses will vary.", teacherNote:"Analytical writing connected to popular media." },
    { title:"Alternate Energy", problem:"Should communities push harder for alternate forms of energy? Write a claim and one evidence need.", hint:"If you need a fact, say what fact would help prove your point.", answer:"Student responses will vary.", teacherNote:"Argument plus research planning." },
    { title:"Author's Style", problem:"Think of a writer, songwriter, filmmaker, or speaker with a distinct style. What makes their style recognizable?", hint:"Point to word choice, structure, tone, image, rhythm, or theme.", answer:"Student responses will vary.", teacherNote:"Response-to-text/craft analysis, broadened beyond books." }
  ]
};

const DO_NOW_SECTIONS = {
  math: {
    label: "Math",
    eyebrow: "Math Do Now",
    enabled: true,
    bank: DO_NOW_MATH
  },
  writing: {
    label: "Writing",
    eyebrow: "Writing Do Now",
    enabled: true,
    bank: DO_NOW_WRITING
  },
  ela: { label: "ELA", enabled: false },
  science: { label: "Science", enabled: false },
  socialStudies: { label: "Social Studies", enabled: false }
};

const VOCAB_WORDS = {
  "K–2": [
    { word:"chuckle", type:"verb", meaning:"to laugh quietly or gently", example:"I heard Maya chuckle at the funny line.", tryIt:"Show a quiet chuckle, then use the word in a sentence." },
    { word:"frost", type:"noun", meaning:"a thin icy layer that forms when it is very cold", example:"Frost sparkled on the grass in the morning.", tryIt:"Name one place you might see frost." },
    { word:"glance", type:"verb", meaning:"to look quickly", example:"I took a glance at the clock before packing up.", tryIt:"Glance at something blue, then tell a partner what you saw." },
    { word:"joy", type:"noun", meaning:"a feeling of great happiness", example:"The class felt joy when the project was finished.", tryIt:"Share one small thing that brings you joy." },
    { word:"whisper", type:"verb", meaning:"to speak very softly", example:"Please whisper while the group is reading.", tryIt:"Whisper the word to a partner, then say its meaning." },
    { word:"brave", type:"adjective", meaning:"showing courage even when something feels hard", example:"It was brave to try again after a mistake.", tryIt:"Finish this sentence: I can be brave when..." }
  ],
  "3–5": [
    { word:"baffle", type:"verb", meaning:"to confuse or puzzle someone", example:"The tricky riddle began to baffle the group.", tryIt:"Describe something that might baffle a detective." },
    { word:"remedy", type:"noun", meaning:"something that helps fix a problem", example:"A short walk was the perfect remedy for feeling restless.", tryIt:"Name a remedy for a noisy classroom." },
    { word:"frail", type:"adjective", meaning:"weak or easily damaged", example:"The frail leaf broke when I touched it.", tryIt:"Think of an object that could be described as frail." },
    { word:"diversity", type:"noun", meaning:"a mix of different people, ideas, or things", example:"Our classroom has diversity in languages, interests, and talents.", tryIt:"List two kinds of diversity that make a group stronger." },
    { word:"acquire", type:"verb", meaning:"to get or learn something over time", example:"Readers acquire new vocabulary by meeting words often.", tryIt:"What skill would you like to acquire this year?" },
    { word:"fabricate", type:"verb", meaning:"to invent or make something up", example:"The character tried to fabricate an excuse.", tryIt:"Create a sentence where fabricate means make up a story." }
  ],
  "6–8": [
    { word:"belligerent", type:"adjective", meaning:"hostile or ready to argue", example:"The debate became less useful when the tone turned belligerent.", tryIt:"Rewrite a belligerent comment so it sounds respectful." },
    { word:"accumulate", type:"verb", meaning:"to gather or build up little by little", example:"Questions began to accumulate as we studied the evidence.", tryIt:"Name something that can accumulate during a busy week." },
    { word:"adept", type:"adjective", meaning:"skilled or very capable at something", example:"She became adept at explaining her reasoning.", tryIt:"What is one thing you are becoming adept at?" },
    { word:"animosity", type:"noun", meaning:"strong dislike or hostility", example:"The characters had to overcome years of animosity.", tryIt:"What action could reduce animosity between two people?" },
    { word:"incessant", type:"adjective", meaning:"continuing without stopping", example:"The incessant tapping made it hard to focus.", tryIt:"Use incessant to describe a sound, thought, or habit." },
    { word:"infamous", type:"adjective", meaning:"well known for a bad reason", example:"The infamous storm changed the town forever.", tryIt:"Explain the difference between famous and infamous." }
  ],
  "9–12": [
    { word:"meticulous", type:"adjective", meaning:"showing extreme care and attention to detail", example:"The lab report was meticulous, with every measurement recorded.", tryIt:"Describe a task that requires meticulous work." },
    { word:"eloquent", type:"adjective", meaning:"clear, powerful, and expressive in speech or writing", example:"Her eloquent argument persuaded the committee.", tryIt:"Turn a plain sentence into a more eloquent one." },
    { word:"ambivalent", type:"adjective", meaning:"having mixed or conflicting feelings", example:"He felt ambivalent about leaving a familiar school.", tryIt:"Describe a decision that could make someone feel ambivalent." },
    { word:"conspicuous", type:"adjective", meaning:"easy to notice; standing out", example:"The missing paragraph left a conspicuous gap in the essay.", tryIt:"What would be conspicuous in a silent library?" },
    { word:"cajole", type:"verb", meaning:"to persuade someone with gentle pressure or flattery", example:"The speaker tried to cajole the audience into volunteering.", tryIt:"Write a sentence where someone tries to cajole a friend." },
    { word:"plethora", type:"noun", meaning:"a very large amount or variety", example:"The article offered a plethora of possible solutions.", tryIt:"Use plethora to describe a useful abundance, not just many things." }
  ]
};

function getEnergy(activity) {
  return (activity.meta || "").split("·").map(x => x.trim()).pop();
}

const INDIVIDUAL_GRADES = ["K","1","2","3","4","5","6","7","8","9","10","11","12"];
function gradeToBand(g) {
  if (!g) return "3–5";
  if (g === "K" || g === "1" || g === "2") return "K–2";
  if (g === "3" || g === "4" || g === "5") return "3–5";
  if (g === "6" || g === "7" || g === "8") return "6–8";
  if (g === "9" || g === "10" || g === "11" || g === "12") return "9–12";
  return g; // already a band (legacy Firestore values)
}

function activityMatchesGrade(activity, grade) {
  if (!grade) return true;
  const band = gradeToBand(grade);
  if (Array.isArray(activity.grades)) return activity.grades.includes(band) || activity.grades.includes(grade);
  if (activity.custom) return true;
  if (typeof activity.id === "string" && activity.id.includes(`-${grade}-`)) return true;
  if (GRADE_RITUAL_ACTIVITY_IDS[grade]) {
    return GRADE_RITUAL_ACTIVITY_IDS[grade].has(Number(activity.id));
  }
  return true;
}

function gradeLabelForActivity(activity, currentGrade) {
  if (!activity) return "";
  if (activity.custom) return "Custom";
  if (Array.isArray(activity.grades) && activity.grades.length) return `Grades ${activity.grades.join(", ")}`;
  if (currentGrade && typeof activity.id === "string" && activity.id.includes(`-${currentGrade}-`)) return `Grades ${currentGrade}`;
  const numericId = Number(activity.id);
  if (Number.isFinite(numericId)) {
    if (currentGrade && GRADE_RITUAL_ACTIVITY_IDS[currentGrade]?.has(numericId)) return `Grades ${currentGrade}`;
    const matches = Object.keys(GRADE_RITUAL_ACTIVITY_IDS).filter(grade => GRADE_RITUAL_ACTIVITY_IDS[grade].has(numericId));
    if (matches.length) return `Grades ${matches.join(", ")}`;
  }
  return currentGrade ? `Grades ${currentGrade}` : "All grades";
}

function excludedActivityIds(excludeId) {
  if (!excludeId) return new Set();
  return new Set(Array.isArray(excludeId) ? excludeId : [excludeId]);
}

function activityMatches(activity, filters = {}, excludeId) {
  const excluded = excludedActivityIds(excludeId);
  if (excluded.has(activity.id)) return false;
  if (filters.grade && !activityMatchesGrade(activity, filters.grade)) return false;
  if (filters.energy && getEnergy(activity) !== filters.energy) return false;
  return true;
}

function pickRandom(cat, excludeId, filters = {}, source = POOL) {
  const excluded = excludedActivityIds(excludeId);
  let pool = source.filter(a => a.cat === cat && activityMatches(a, filters, excludeId));
  if (!pool.length && filters.grade && filters.energy) {
    pool = source.filter(a => a.cat === cat && activityMatchesGrade(a, filters.grade) && !excluded.has(a.id));
  }
  if (!pool.length) pool = source.filter(a => a.cat === cat && !excluded.has(a.id));
  if (!pool.length) pool = source.filter(a => a.cat === cat);
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickRoutine(filters = {}, source = POOL) {
  const cats = (filters.cats && filters.cats.length ? filters.cats : DEFAULT_CATS)
    .filter(cat => CAT_META[cat]);
  const limit = TIME_LIMITS[filters.time] ?? TIME_LIMITS["10 min"];
  const routine = [];
  let total = 0;

  cats.forEach(cat => {
    const next = pickRandom(cat, null, filters, source);
    if (!next) return;
    if (routine.length === 0 || total + next.time <= limit || limit === Infinity) {
      routine.push(next);
      total += next.time;
    }
  });

  if (!routine.length) {
    const fallbackCat = cats[0] || DEFAULT_CATS[0];
    const fallback = pickRandom(fallbackCat, null, {}, source);
    if (fallback) routine.push(fallback);
  }

  return routine;
}

function formatToday() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  });
}

function getVocabBank(grade = "3–5", custom = {}) {
  const band = gradeToBand(grade);
  return [...(VOCAB_WORDS[band] || VOCAB_WORDS["3–5"]), ...(custom[band] || custom[grade] || [])];
}

function getDoNowBank(subject = "math", grade = "3–5", custom = {}) {
  const band = gradeToBand(grade);
  const section = DO_NOW_SECTIONS[subject] || DO_NOW_SECTIONS.math;
  const builtIns = (section.bank || DO_NOW_SECTIONS.math.bank)[band] || (section.bank || DO_NOW_SECTIONS.math.bank)["3–5"] || DO_NOW_SECTIONS.math.bank["3–5"];
  return [...builtIns, ...((custom[subject] || {})[band] || (custom[subject] || {})[grade] || [])];
}

function pickDailyVocab(grade = "3–5", offset = 0, custom = {}) {
  const words = getVocabBank(grade, custom);
  const dayKey = Math.floor(Date.now() / 86400000) + offset;
  return words[Math.abs(dayKey) % words.length];
}

function pickDailyDoNow(subject = "math", grade = "3–5", offset = 0, custom = {}) {
  const problems = getDoNowBank(subject, grade, custom);
  const dayKey = Math.floor(Date.now() / 86400000) + offset;
  return problems[Math.abs(dayKey) % problems.length];
}

function contentKey(prefix, grade, item, field) {
  return `${prefix}-${grade}-${encodeURIComponent(item.id || item[field])}`;
}

function vocabToActivity(word, grade = "3–5") {
  return {
    id: contentKey("vocab", grade, word, "word"),
    cat: "Vocabulary",
    title: `Vocabulary: ${word.word}`,
    meta: "3 min · Calm",
    time: 180,
    grades: [grade],
    prompt: `${word.word} — ${word.meaning}`,
    starter: word.tryIt || "Use the word in your own sentence.",
    directions: `Part of speech: ${word.type}. Example: “${word.example}”`,
    source: word.custom ? "Custom Word" : VOCAB_SOURCE.name,
    sourceUrl: word.custom ? "" : VOCAB_SOURCE.url
  };
}

function doNowToActivity(problem, grade = "3–5", subject = "math") {
  const section = DO_NOW_SECTIONS[subject] || DO_NOW_SECTIONS.math;
  return {
    id: contentKey(subject, grade, problem, "title"),
    cat: subject === "math" ? "Math Do Now" : subject === "writing" ? "Writing Do Now" : "Brain Teaser",
    title: `${section.label}: ${problem.title}`,
    meta: "5 min · Medium",
    time: 300,
    grades: [grade],
    prompt: problem.problem,
    starter: problem.hint,
    directions: `Answer: ${problem.answer}\nTeacher note: ${problem.teacherNote}`
  };
}

function buildContentActivities(grade = "3–5", customVocab = {}, customDoNow = {}) {
  const words = getVocabBank(grade, customVocab).map(word => vocabToActivity(word, grade));
  const math = getDoNowBank("math", grade, customDoNow).map(problem => doNowToActivity(problem, grade, "math"));
  const writing = getDoNowBank("writing", grade, customDoNow).map(prompt => doNowToActivity(prompt, grade, "writing"));
  const history = getFallbackHistory().slice(0, 6).map(item => historyToActivity(item, onThisDayUrl()));
  return [...words, ...math, ...writing, ...history];
}

function uniqueActivities(activities = []) {
  const byId = new Map();
  activities.filter(Boolean).forEach(activity => {
    const key = String(activity.id);
    if (!byId.has(key)) byId.set(key, activity);
  });
  return Array.from(byId.values());
}

function buildLibraryActivities(customActivities = [], customVocab = {}, customDoNow = {}, pool = POOL) {
  const gradeContent = Object.keys(GRADE_RITUAL_ACTIVITY_IDS)
    .flatMap(grade => buildContentActivities(grade, customVocab, customDoNow));
  return uniqueActivities([...pool, ...customActivities, ...gradeContent]);
}


function readStoredFavorites() {
  try {
    const raw = localStorage.getItem("ofd:favorites");
    const ids = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(ids) ? ids : []);
  } catch {
    return new Set();
  }
}

function readStoredCustomActivities() {
  try {
    const raw = localStorage.getItem("ofd:customActivities");
    const items = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(items)) return [];
    return items.filter(a => a && a.id && a.title && a.prompt && CAT_META[a.cat]);
  } catch {
    return [];
  }
}

function readSavedRoutines() {
  try {
    const raw = localStorage.getItem("ofd:savedRoutines");
    const items = raw ? JSON.parse(raw) : [];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

const PRESENTATION_VIEW_KEY = 'ofd:presentationView';
function readPresentationView() {
  try { return localStorage.getItem(PRESENTATION_VIEW_KEY) === 'guided' ? 'guided' : 'clean'; } catch { return 'clean'; }
}

function projectorWindowUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("projector", "1");
  url.hash = "";
  return url.toString();
}

function readSeenActivities() {
  try {
    const raw = localStorage.getItem('ofd:seenActivities');
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

function markActivitiesSeen(ids) {
  try {
    const existing = readSeenActivities();
    ids.forEach(id => existing.add(id));
    localStorage.setItem('ofd:seenActivities', JSON.stringify([...existing]));
  } catch {}
}

function readUsedToday() {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const raw = localStorage.getItem('ofd:usedToday');
    const obj = raw ? JSON.parse(raw) : {};
    return new Set(obj.date === today ? (obj.ids || []) : []);
  } catch { return new Set(); }
}

function recordUsedToday(ids) {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const raw = localStorage.getItem('ofd:usedToday');
    const obj = raw ? JSON.parse(raw) : {};
    const existing = new Set(obj.date === today ? (obj.ids || []) : []);
    ids.forEach(id => existing.add(id));
    localStorage.setItem('ofd:usedToday', JSON.stringify({ date: today, ids: [...existing] }));
  } catch {}
}

function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(new Date(d).setDate(diff)).toISOString().slice(0, 10);
}

function readUsedThisWeek() {
  const weekStart = getWeekStart();
  try {
    const raw = localStorage.getItem('ofd:usedThisWeek');
    const obj = raw ? JSON.parse(raw) : {};
    return new Set(obj.weekStart === weekStart ? (obj.ids || []) : []);
  } catch { return new Set(); }
}

function recordUsedThisWeek(ids) {
  const weekStart = getWeekStart();
  try {
    const raw = localStorage.getItem('ofd:usedThisWeek');
    const obj = raw ? JSON.parse(raw) : {};
    const existing = new Set(obj.weekStart === weekStart ? (obj.ids || []) : []);
    ids.forEach(id => existing.add(id));
    localStorage.setItem('ofd:usedThisWeek', JSON.stringify({ weekStart, ids: [...existing] }));
  } catch {}
}

function readCustomVocab() {
  try {
    return JSON.parse(localStorage.getItem("ofd:customVocab") || "{}") || {};
  } catch {
    return {};
  }
}

function readCustomDoNow() {
  try {
    return JSON.parse(localStorage.getItem("ofd:customDoNow") || "{}") || {};
  } catch {
    return {};
  }
}

function persistCustomActivities(items) {
  try { localStorage.setItem("ofd:customActivities", JSON.stringify(items)); } catch {}
}

function persistSavedRoutines(items) {
  try { localStorage.setItem("ofd:savedRoutines", JSON.stringify(items)); } catch {}
}

function persistCustomVocab(data) {
  try { localStorage.setItem("ofd:customVocab", JSON.stringify(data)); } catch {}
}

function persistCustomDoNow(data) {
  try { localStorage.setItem("ofd:customDoNow", JSON.stringify(data)); } catch {}
}

/* ── toast hook ── */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, undoFn) => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, undoFn }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);
  return { toasts, show };
}

/* ── shared components ── */
function Chip({ label, active, onClick }) {
  return <button className={`chip${active ? ' active' : ''}`} type="button" onClick={onClick}>{label}</button>;
}

function GradePicker({ value, onChange }) {
  return (
    <div className="grade-chips-topbar" role="group" aria-label="Grade level">
      {["K–2","3–5","6–8","9–12"].map(g => (
        <button
          key={g} type="button"
          className={`grade-chip-topbar${value === g ? ' active' : ''}`}
          onClick={() => onChange(g)}
          aria-pressed={value === g}
        >{g}</button>
      ))}
    </div>
  );
}

/* ── Activity Card ── */
function ActivityCard({ activity, selected, onSelect, onSwap, onFave, favorites, usedToday, seenActivities, index, useNow = false }) {
  const cm = CAT_META[activity.cat] || { color: "#CCC" };
  const isFave = favorites?.has(activity.id) ?? false;
  const usedNow = usedToday?.has(activity.id) ?? false;
  const isNew = seenActivities != null && !seenActivities.has(activity.id);
  return (
    <div className={`card component-card${selected ? ' selected' : ''}${useNow ? ' use-now' : ''}`} role="button" tabIndex="0"
      onClick={() => onSelect(activity)}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(activity); } }}>
      {typeof index === "number" ? <div className="morning-card-index" style={{ background: cm.dark || cm.color }}>{index + 1}</div> : <div className="card-stripe" style={{ background: cm.color }}/>}
      <div className="card-inner">
        <div className="card-cat">{activity.cat}{usedNow && !useNow && <span className="card-used-badge">✓ Today</span>}</div>
        <div className="card-title">{activity.title}{isNew && <span className="card-new-badge">New</span>}</div>
        <div className="card-meta">{activity.meta}</div>
        <div className="card-actions">
          <button className={`btn-heart${isFave ? ' saved' : ''}`} type="button" aria-label={isFave ? "Remove from favorites" : "Save to favorites"}
            onClick={e => { e.stopPropagation(); onFave(activity); }}>
            {isFave ? "♥" : "♡"}
          </button>
          <button className="btn-swap" type="button" aria-label={`Replace ${activity.title}`} onClick={e => { e.stopPropagation(); onSwap(activity); }}>
            Replace
          </button>
        </div>
      </div>
      {useNow && <div className="card-chevron" aria-hidden="true">›</div>}
    </div>
  );
}

/* ── Detail Panel ── */
function DetailContent({ activity, onSwap, onDisplayOne, onAddToRoutine, onRemove, onFave, isFavorite, currentGrade }) {
  const cm = CAT_META[activity.cat] || { color: "#CCC" };
  const gradeLabel = gradeLabelForActivity(activity, currentGrade);
  return (
    <>
      <div className="detail-scroll">
        <div className="d-top">
          <div className="d-stripe-bar" style={{ background: cm.color }}/>
          <div className="d-cat">{activity.cat}</div>
          <div className="d-title">{activity.title}</div>
          <div className="d-meta">{activity.meta} · {gradeLabel}</div>
        </div>
        {activity.directions && (
          <div className="d-section">
            <div className="d-label">How to Run It</div>
            <div className="d-text">{activity.directions}</div>
          </div>
        )}
        <div className="d-section">
          <div className="d-label">Student Prompt</div>
          <div className="prompt-box">"{activity.prompt}"</div>
          {activity.starter && (
            <div className="starter-wrap">
              <div className="starter-label">Sentence starter</div>
              <div className="starter-text">"{activity.starter}"</div>
            </div>
          )}
        </div>
        <div className="d-section">
          <div className="d-label">Supports</div>
          <div className="supports-row">
            {["Read aloud","Simplify language","Visual cue"].map(s =>
              <span key={s} className="support-tag">{s}</span>
            )}
          </div>
        </div>
        {activity.source && (
          <div className="d-section">
            <div className="d-label">Source Inspiration</div>
            <div className="d-text">
              <a className="source-link" href={activity.sourceUrl} target="_blank" rel="noreferrer">{activity.source}</a>
            </div>
          </div>
        )}
      </div>
      <div className="d-actions">
        <button className="d-btn-swap" type="button" onClick={() => onSwap(activity)}>↻ Replace</button>
        <button className="d-btn-display" type="button" onClick={() => onDisplayOne(activity)}>▶ Project</button>
        <details className="d-more-actions">
          <summary>More options</summary>
          <div className="d-more-action-row">
            {onFave && <button className="d-btn-swap" type="button" aria-label={isFavorite ? `Remove ${activity.title} from favorites` : `Save ${activity.title} to favorites`} onClick={() => onFave(activity)}>{isFavorite ? "Saved Favorite" : "Save Favorite"}</button>}
            <button className="d-btn-swap" type="button" aria-label={`Add ${activity.title} to routine builder`} onClick={() => onAddToRoutine(activity)}>Add to Routine</button>
            {onRemove && <button className="d-btn-swap btn-remove" type="button" aria-label={`Remove ${activity.title} from today`} onClick={() => onRemove(activity)}>Remove from Today</button>}
          </div>
        </details>
      </div>
    </>
  );
}

function DetailPanel({ activity, onSwap, onDisplayOne, onAddToRoutine, onRemove, onFave, favorites, currentGrade }) {
  return (
    <div className="detail-panel">
      {activity
        ? <DetailContent activity={activity} onSwap={onSwap} onDisplayOne={onDisplayOne} onAddToRoutine={onAddToRoutine} onRemove={onRemove} onFave={onFave} isFavorite={favorites?.has(activity.id)} currentGrade={currentGrade}/>
        : <div className="detail-empty">
            <div className="detail-empty-icon">←</div>
            <div className="detail-empty-text">Tap any activity to preview directions, the student prompt, and projector controls.</div>
          </div>
      }
    </div>
  );
}

function PresentationChoiceModal({ defaultView = "clean", onChoose, onClose }) {
  const cleanIsDefault = defaultView !== "guided";
  return (
    <div className="overlay dialog-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="filter-sheet presentation-choice-sheet" role="dialog" aria-modal="true" aria-labelledby="presentation-choice-title">
        <div className="sheet-handle"/>
        <div className="sheet-title" id="presentation-choice-title">Choose Presentation Style</div>
        <div className="sheet-body">
        <div className="presentation-helper">Clean View is the simplest student display. Guided View shows facilitation notes on the projected screen.</div>
          <div className="presentation-options">
            <button className={`presentation-option${cleanIsDefault ? " primary" : ""}`} type="button" onClick={() => onChoose("clean")}>
              <span className="presentation-option-title">Clean View</span>
              <span className="presentation-option-text">Minimal classroom projection</span>
            </button>
            <button className={`presentation-option${!cleanIsDefault ? " primary" : ""}`} type="button" onClick={() => onChoose("guided")}>
              <span className="presentation-option-title">Guided View</span>
              <span className="presentation-option-text">Includes facilitation guidance</span>
            </button>
          </div>
        </div>
        <div className="sheet-footer">
          <button className="btn-secondary" type="button" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ── Projector Style / Data Tools ── */
function SettingsSheet({ onClose, onExport, onImport, onReset, projectorStyle, onProjectorStyleChange, onCloudSave, onCloudRestore, cloudStatus, cloudBusy, cloudAutoSave, onCloudAutoSaveChange }) {
  const [importText, setImportText] = useState("");
  const [style, setStyle] = useState(() => normalizeProjectorStyle(projectorStyle));
  const [urlStatus, setUrlStatus] = useState("");
  const updateStyle = (key, value) => {
    const next = normalizeProjectorStyle({ ...style, [key]: value });
    setStyle(next);
    onProjectorStyleChange(next);
  };
  const applyTheme = key => {
    const theme = PROJECTOR_THEMES[key] || PROJECTOR_THEMES.Calm;
    const next = normalizeProjectorStyle({
      ...style,
      theme: key,
      backgroundColor: theme.background,
      topColor: theme.top,
      accentColor: theme.accent,
      textColor: theme.text || "#FFFFFF",
      backgroundPreset: THEME_BACKGROUND_PRESETS[key] || "Solid",
      backgroundUrl: "",
      overlayOpacity: 4,
      homeAccent: theme.homeAccent || theme.accent,
      homeSoft: theme.homeSoft || "#EBF5F2"
    });
    setStyle(next);
    onProjectorStyleChange(next);
  };
  const previewOverlay = getProjectorBackgroundImage(style);
  const applyBackgroundPreset = key => {
    const next = normalizeProjectorStyle({
      ...style,
      backgroundPreset: key,
      backgroundUrl: key === "CustomUrl" ? style.backgroundUrl : ""
    });
    setStyle(next);
    setUrlStatus("");
    onProjectorStyleChange(next);
  };
  const testBackgroundUrl = () => {
    const url = normalizeBackgroundUrl(style.backgroundUrl);
    if (!url) {
      setUrlStatus("Paste a direct image or GIF URL first.");
      return;
    }
    if (!isLikelyDirectImageUrl(url)) {
      setUrlStatus("This looks like a web page, not a direct image. Try a URL ending in .jpg, .png, .webp, or .gif.");
      return;
    }
    const img = new Image();
    img.onload = () => setUrlStatus("Looks good. This background should project.");
    img.onerror = () => setUrlStatus("That image could not load. Try another direct image/GIF URL.");
    img.src = url; 
  };
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="filter-sheet settings-sheet">
        <div className="sheet-handle"/>
        <div className="sheet-title">Settings</div>
        <div className="sheet-body custom-form settings-layout">
          <div className="settings-section projector-settings-section">
            <div className="settings-section-title">Display Style</div>
            <div className="projector-settings-grid">
              <div className="projector-preview-stack">
                <div className="settings-note">
                  Add a little classroom personality while keeping projected screens readable from across the room.
                </div>
                <div className="projector-preview" style={{ backgroundColor: style.backgroundColor, backgroundImage: previewOverlay }}>
                  <div className="projector-preview-bar" style={{ background: style.topColor }}>
                    <span>{style.className}</span>
                    <span>{style.showTimer ? "3:00" : "No timer"}</span>
                  </div>
                  <div className="projector-preview-prompt" style={{ color: style.textColor }}>Good morning, learners.</div>
                  {style.motto && <div className="projector-preview-motto">{style.motto}</div>}
                </div>
                <div className="settings-mini-heading">Theme Presets</div>
                <div className="settings-help">Choose a full projector look. Presets update colors, text, accents, and the starting background style together.</div>
                <div className="theme-actions">
                  {Object.keys(PROJECTOR_THEMES).map(key => {
                    const preset = THEME_BACKGROUND_PRESETS[key] || "Solid";
                    const bg = PROJECTOR_BACKGROUNDS[preset] || PROJECTOR_BACKGROUNDS.Solid;
                    return <button key={key} className={"theme-preset" + (style.theme === key ? " active" : "")} type="button" onClick={() => applyTheme(key)}>
                      <span className="theme-preset-swatch" style={{ backgroundColor: PROJECTOR_THEMES[key].background, backgroundImage: bg.image }} />
                      <span className="theme-preset-label">{PROJECTOR_THEMES[key].label} · {PROJECTOR_BACKGROUNDS[preset]?.label || "Solid"}</span>
                    </button>;
                  })}
                </div>
              </div>
              <div className="projector-controls-stack">
                <div className="form-grid projector-form-grid">
                  <label className="form-field"><span>Class Name</span><input value={style.className} maxLength="42" onChange={e => updateStyle("className", e.target.value)}/></label>
                  <label className="form-field"><span>Text Size</span><select value={style.textSize} onChange={e => updateStyle("textSize", e.target.value)}><option>Normal</option><option>Large</option><option>Extra Large</option></select></label>
                  <label className="form-field"><span>Home Accent</span><input type="color" value={style.homeAccent} onChange={e => updateStyle("homeAccent", e.target.value)}/></label>
                </div>
                <label className="form-field"><span>Class Motto</span><input value={style.motto} maxLength="72" placeholder="Example: We listen, learn, and help." onChange={e => updateStyle("motto", e.target.value)}/></label>
                <div className="settings-mini-heading">Projector Colors</div>
                <div className="color-grid">
                  <label className="form-field color-field"><span>Background</span><input type="color" value={style.backgroundColor} onChange={e => updateStyle("backgroundColor", e.target.value)}/></label>
                  <label className="form-field color-field"><span>Top Bar</span><input type="color" value={style.topColor} onChange={e => updateStyle("topColor", e.target.value)}/></label>
                  <label className="form-field color-field"><span>Accent</span><input type="color" value={style.accentColor} onChange={e => updateStyle("accentColor", e.target.value)}/></label>
                  <label className="form-field color-field"><span>Text</span><input type="color" value={style.textColor} onChange={e => updateStyle("textColor", e.target.value)}/></label>
                </div>
                <div className="settings-mini-heading">Background Style</div>
                <div className="background-grid">
                  {Object.entries(PROJECTOR_BACKGROUNDS).map(([key, bg]) => (
                    <button key={key} className={"background-choice" + (style.backgroundPreset === key ? " active" : "")} type="button" onClick={() => applyBackgroundPreset(key)}>
                      <span className="background-swatch" style={{ backgroundColor: style.backgroundColor, backgroundImage: key === "CustomUrl" && style.backgroundUrl ? `url("${style.backgroundUrl}")` : bg.image }} />
                      <span className="background-label">{bg.label}</span>
                    </button>
                  ))}
                </div>
                {style.backgroundPreset === "CustomUrl" && (
                  <>
                    <div className="settings-help">Use a direct image/GIF link ending in .jpg, .png, .webp, or .gif. Search-result pages and Giphy page links often will not project.</div>
                    <div className="url-row">
                      <label className="form-field"><span>Direct Image/GIF URL</span><input value={style.backgroundUrl} placeholder="https://example.com/background.gif" onChange={e => { updateStyle("backgroundUrl", e.target.value); setUrlStatus(""); }}/></label>
                      <button className="btn-secondary btn-compact" type="button" onClick={testBackgroundUrl}>Test Background</button>
                    </div>
                    {urlStatus && <div className={"url-status" + (urlStatus.startsWith("Looks good") ? " good" : " bad")}>{urlStatus}</div>}
                  </>
                )}
                <label className="range-row"><span>Dim background</span><input type="range" min="0" max="85" value={style.overlayOpacity} onChange={e => updateStyle("overlayOpacity", e.target.value)}/><span>{style.overlayOpacity}%</span></label>
                <div className="projector-toggle-row">
                  <label className="projector-toggle"><input type="checkbox" checked={style.showTimer} onChange={e => updateStyle("showTimer", e.target.checked)}/><span>Show timer</span></label>
                  <label className="projector-toggle"><input type="checkbox" checked={style.showStarter} onChange={e => updateStyle("showStarter", e.target.checked)}/><span>Show sentence starter</span></label>
                </div>
              </div>
            </div>
          </div>

          <div className="settings-side-stack">
            <details className="settings-details">
              <summary>
                <span>
                  <span className="settings-details-title">Sync</span>
                  <span className="settings-details-copy">Keep your classroom setup available when you need it.</span>
                </span>
              </summary>
              <div className="settings-details-body">
                <div className="settings-note">
                  Save this teacher profile, routines, favorites, custom activities, words, Do Now items, and projector style.
                </div>
                <label className="cloud-toggle">
                  <input type="checkbox" checked={cloudAutoSave} onChange={e => onCloudAutoSaveChange(e.target.checked)}/>
                  <span>Auto-save changes</span>
                </label>
                <div className="settings-actions">
                  <button className="btn-primary" type="button" disabled={cloudBusy} onClick={onCloudSave}>{cloudBusy ? "Working..." : "Save Now"}</button>
                  <button className="btn-secondary" type="button" disabled={cloudBusy} onClick={onCloudRestore}>Restore Saved Data</button>
                </div>
                {cloudStatus && <div className={"cloud-status" + (cloudStatus.startsWith("Saved") || cloudStatus.startsWith("Restored") ? " good" : cloudStatus.startsWith("Cloud") ? " bad" : "")}>{cloudStatus}</div>}
              </div>
            </details>
            <details className="settings-details">
              <summary>
                <span>
                  <span className="settings-details-title">Data & Backup</span>
                  <span className="settings-details-copy">Use these before switching devices or making big changes.</span>
                </span>
              </summary>
              <div className="settings-details-body">
                <div className="settings-actions">
                  <button className="btn-primary" type="button" onClick={onExport}>Export Backup</button>
                  <button className="btn-danger" type="button" onClick={onReset}>Reset Local Data</button>
                </div>
                <label className="form-field">
                  <span>Import Backup JSON</span>
                  <textarea rows="5" value={importText} onChange={e => setImportText(e.target.value)} placeholder="Paste an exported backup here"/>
                </label>
                <button className="btn-secondary" type="button" onClick={() => onImport(importText)}>Import Backup</button>
              </div>
            </details>
          </div>
        </div>
        <div className="sheet-footer">
          <button className="btn-secondary" type="button" style={{flex:1}} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ── Profile Sheet ── */
function ProfileSheet({ account, displayName, trialDaysLeft, effectivePlan, onClose, onSignOut, onSave }) {
  const [name, setName] = useState(displayName || account?.name || '');
  const [grade, setGrade] = useState(account?.grade || '3');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const msg = 'I use OfTheDay.net for my morning meetings — a complete, grade-appropriate routine in seconds. Try it free: https://oftheday.net';
    try { navigator.clipboard.writeText(msg); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const initials = (name || account?.name || account?.email || '?')[0].toUpperCase();

  const planLabel = account?.tier === 'pro'
    ? 'Pro'
    : trialDaysLeft !== null
      ? `Trial · ${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} left`
      : 'Free';
  const planClass = account?.tier === 'pro'
    ? 'profile-plan-badge--pro'
    : trialDaysLeft !== null
      ? 'profile-plan-badge--trial'
      : 'profile-plan-badge--free';

  const handleSave = async () => {
    setSaving(true);
    try {
      if (account?.uid) await updateUserProfile(account.uid, { name: name.trim(), grade });
      onSave({ name: name.trim(), grade });
      onClose();
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="filter-sheet profile-sheet">
        <div className="sheet-handle"/>
        <div className="sheet-title">Your Profile</div>
        <div className="sheet-body">
          <div className="profile-avatar-row">
            <div className="profile-avatar-lg">{initials}</div>
            <div className="profile-identity">
              <div className="profile-email">{account?.email}</div>
              <span className={`profile-plan-badge ${planClass}`}>{planLabel}</span>
              {effectivePlan !== 'pro' && (
                <a href="/upgrade" className="profile-upgrade-link">Upgrade to Pro →</a>
              )}
            </div>
          </div>
          <div className="form-grid profile-form-grid">
            <label className="form-field">
              <span>Your Name</span>
              <input value={name} onChange={e => setName(e.target.value)} maxLength={50} placeholder="Your name"/>
            </label>
            <label className="form-field">
              <span>Your Grade</span>
              <select value={grade} onChange={e => setGrade(e.target.value)}>
                {INDIVIDUAL_GRADES.map(g => <option key={g} value={g}>{g === 'K' ? 'Kindergarten' : `Grade ${g}`}</option>)}
              </select>
            </label>
          </div>
        </div>
        <div className="sheet-footer" style={{flexDirection:'column', gap: 12}}>
          <button className="btn-primary" type="button" style={{width:'100%'}} disabled={saving} onClick={handleSave}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <div className="profile-footer-row">
            <button className="profile-share-link" type="button" onClick={handleShare}>
              {copied ? '✓ Copied!' : '↗ Share with a colleague'}
            </button>
            <button className="profile-signout-link" type="button" onClick={() => { onClose(); onSignOut(); }}>
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Filter Sheet ── */
function FilterSheet({ filters, onApply, onClose }) {
  const [local, setLocal] = useState({ ...filters });
  const toggle = (key, val) => setLocal(f => ({ ...f, [key]: f[key] === val ? null : val }));
  const toggleCat = cat => {
    const cur = local.cats || [];
    setLocal(f => ({ ...f, cats: cur.includes(cat) ? cur.filter(x=>x!==cat) : [...cur, cat] }));
  };
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="filter-sheet">
        <div className="sheet-handle"/>
        <div className="sheet-title">Choose Filters</div>
        <div className="sheet-body">
          {[
            { label:"Grade Band", key:"grade", opts:["K–2","3–5","6–8","9–12"] },
            { label:"Time Available", key:"time", opts:["5 min","10 min","15 min","20+ min"] },
            { label:"Energy Level", key:"energy", opts:["Calm","Medium","Active"] },
          ].map(g => (
            <div key={g.key}>
              <div className="f-group-label">{g.label}</div>
              <div className="f-chips">
                {g.opts.map(o => <Chip key={o} label={o} active={local[g.key]===o} onClick={() => toggle(g.key, o)}/>)}
              </div>
            </div>
          ))}
          <div>
            <div className="f-group-label">Categories</div>
            <div className="f-chips">
              {Object.keys(CAT_META).map(c =>
                <Chip key={c} label={c} active={(local.cats||[]).includes(c)} onClick={() => toggleCat(c)}/>
              )}
            </div>
          </div>
        </div>
        <div className="sheet-footer">
          <button className="btn-secondary" type="button" style={{flex:1}} onClick={onClose}>Cancel</button>
          <button className="btn-primary" type="button" style={{flex:2,justifyContent:"center"}} onClick={() => { onApply(local); onClose(); }}>Update Routine</button>
        </div>
      </div>
    </div>
  );
}

/* ── Custom Activity Sheet ── */
function CustomActivitySheet({ initialActivity, onSave, onClose }) {
  const [draft, setDraft] = useState(() => initialActivity ? {
    id: initialActivity.id,
    cat: initialActivity.cat,
    title: initialActivity.title,
    time: Math.max(1, Math.round((initialActivity.time || 180) / 60)),
    energy: getEnergy(initialActivity) || "Medium",
    prompt: initialActivity.prompt || "",
    starter: initialActivity.starter || "",
    directions: initialActivity.directions || ""
  } : {
    cat: "Greeting",
    title: "",
    time: 3,
    energy: "Medium",
    prompt: "",
    starter: "",
    directions: ""
  });
  const setField = (key, value) => setDraft(d => ({ ...d, [key]: value }));
  const canSave = draft.title.trim() && draft.prompt.trim();

  const save = () => {
    if (!canSave) return;
    const minutes = Math.max(1, Math.min(30, Number(draft.time) || 3));
    onSave({
      id: draft.id || `custom-${Date.now()}`,
      custom: true,
      cat: draft.cat,
      title: draft.title.trim(),
      meta: `${minutes} min · ${draft.energy}`,
      time: minutes * 60,
      prompt: draft.prompt.trim(),
      starter: draft.starter.trim(),
      directions: draft.directions.trim()
    });
    onClose();
  };

  return (
    <div className="overlay dialog-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="filter-sheet custom-sheet">
        <div className="sheet-handle"/>
        <div className="sheet-title">{initialActivity ? "Edit Activity" : "Create Activity"}</div>
        <div className="sheet-body custom-form">
          <label className="form-field">
            <span>Title</span>
            <input value={draft.title} onChange={e => setField("title", e.target.value)} placeholder="Morning debate"/>
          </label>
          <div className="form-grid">
            <label className="form-field">
              <span>Category</span>
              <select value={draft.cat} onChange={e => setField("cat", e.target.value)}>
                {Object.keys(CAT_META).map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </label>
            <label className="form-field">
              <span>Minutes</span>
              <input type="number" min="1" max="30" value={draft.time} onChange={e => setField("time", e.target.value)}/>
            </label>
            <label className="form-field">
              <span>Energy</span>
              <select value={draft.energy} onChange={e => setField("energy", e.target.value)}>
                {["Calm","Medium","Active"].map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </label>
          </div>
          <label className="form-field">
            <span>Student Prompt</span>
            <textarea value={draft.prompt} onChange={e => setField("prompt", e.target.value)} rows="3" placeholder="What should students see or respond to?"/>
          </label>
          <label className="form-field">
            <span>Sentence Starter</span>
            <input value={draft.starter} onChange={e => setField("starter", e.target.value)} placeholder="I think..."/>
          </label>
          <label className="form-field">
            <span>Teacher Directions</span>
            <textarea value={draft.directions} onChange={e => setField("directions", e.target.value)} rows="3" placeholder="How should the teacher run it?"/>
          </label>
        </div>
        <div className="sheet-footer">
          <button className="btn-secondary" type="button" style={{flex:1}} onClick={onClose}>Cancel</button>
          <button className="btn-primary" type="button" style={{flex:2,justifyContent:"center"}} disabled={!canSave} onClick={save}>{initialActivity ? "Update Activity" : "Save Activity"}</button>
        </div>
      </div>
    </div>
  );
}

/* ── Word and Problem Editors ── */
function WordEditorSheet({ grade, initialWord, onSave, onClose }) {
  const [draft, setDraft] = useState(() => initialWord || { word:"", type:"noun", meaning:"", example:"", tryIt:"" });
  const setField = (key, value) => setDraft(d => ({ ...d, [key]: value }));
  const canSave = draft.word.trim() && draft.meaning.trim() && draft.example.trim();
  const save = () => {
    if (!canSave) return;
    onSave({
      ...draft,
      id: draft.id || `word-${Date.now()}`,
      custom: true,
      word: draft.word.trim(),
      type: draft.type.trim() || "word",
      meaning: draft.meaning.trim(),
      example: draft.example.trim(),
      tryIt: draft.tryIt.trim() || "Use the word in your own sentence."
    });
    onClose();
  };
  return (
    <div className="overlay dialog-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="filter-sheet custom-sheet">
        <div className="sheet-handle"/>
        <div className="sheet-title">{initialWord ? "Edit Word" : "Add Word"} · {grade}</div>
        <div className="sheet-body custom-form">
          <div className="form-grid">
            <label className="form-field"><span>Word</span><input value={draft.word} onChange={e => setField("word", e.target.value)}/></label>
            <label className="form-field"><span>Type</span><input value={draft.type} onChange={e => setField("type", e.target.value)} placeholder="noun, verb, adjective"/></label>
          </div>
          <label className="form-field"><span>Meaning</span><textarea rows="2" value={draft.meaning} onChange={e => setField("meaning", e.target.value)}/></label>
          <label className="form-field"><span>Example</span><textarea rows="2" value={draft.example} onChange={e => setField("example", e.target.value)}/></label>
          <label className="form-field"><span>Try It</span><textarea rows="2" value={draft.tryIt} onChange={e => setField("tryIt", e.target.value)}/></label>
        </div>
        <div className="sheet-footer">
          <button className="btn-secondary" type="button" style={{flex:1}} onClick={onClose}>Cancel</button>
          <button className="btn-primary" type="button" style={{flex:2,justifyContent:"center"}} disabled={!canSave} onClick={save}>Save Word</button>
        </div>
      </div>
    </div>
  );
}

function DoNowEditorSheet({ grade, subject, initialProblem, onSave, onClose }) {
  const [draft, setDraft] = useState(() => initialProblem || { title:"", problem:"", hint:"", answer:"", teacherNote:"" });
  const setField = (key, value) => setDraft(d => ({ ...d, [key]: value }));
  const canSave = draft.title.trim() && draft.problem.trim() && draft.answer.trim();
  const save = () => {
    if (!canSave) return;
    onSave({
      ...draft,
      id: draft.id || `do-now-${Date.now()}`,
      custom: true,
      title: draft.title.trim(),
      problem: draft.problem.trim(),
      hint: draft.hint.trim() || "Think about what information the problem gives you.",
      answer: draft.answer.trim(),
      teacherNote: draft.teacherNote.trim() || "Ask students to explain their reasoning."
    });
    onClose();
  };
  return (
    <div className="overlay dialog-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="filter-sheet custom-sheet">
        <div className="sheet-handle"/>
        <div className="sheet-title">{initialProblem ? "Edit Problem" : "Add Problem"} · {DO_NOW_SECTIONS[subject].label} · {grade}</div>
        <div className="sheet-body custom-form">
          <label className="form-field"><span>Title</span><input value={draft.title} onChange={e => setField("title", e.target.value)}/></label>
          <label className="form-field"><span>Problem</span><textarea rows="3" value={draft.problem} onChange={e => setField("problem", e.target.value)}/></label>
          <label className="form-field"><span>Hint</span><textarea rows="2" value={draft.hint} onChange={e => setField("hint", e.target.value)}/></label>
          <label className="form-field"><span>Answer</span><textarea rows="2" value={draft.answer} onChange={e => setField("answer", e.target.value)}/></label>
          <label className="form-field"><span>Teacher Note</span><textarea rows="2" value={draft.teacherNote} onChange={e => setField("teacherNote", e.target.value)}/></label>
        </div>
        <div className="sheet-footer">
          <button className="btn-secondary" type="button" style={{flex:1}} onClick={onClose}>Cancel</button>
          <button className="btn-primary" type="button" style={{flex:2,justifyContent:"center"}} disabled={!canSave} onClick={save}>Save Problem</button>
        </div>
      </div>
    </div>
  );
}

/* ── Browse Screen ── */
function BrowseScreen({ activities, grade, favorites, usedToday, builderCount, replacementTarget, onCancelReplacement, onFave, onCreate, onAdd, onBuild, onDisplay, onReviewRoutine, onOpenTool, userTier = 'pro', onUpgradeNeeded }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!q.trim()) return activities;
    const lq = q.toLowerCase();
    return activities.filter(a =>
      a.title.toLowerCase().includes(lq) ||
      a.cat.toLowerCase().includes(lq) ||
      a.prompt.toLowerCase().includes(lq)
    );
  }, [q, activities]);
  const byCat = useMemo(() => {
    const map = {};
    filtered.forEach(a => { if (!map[a.cat]) map[a.cat] = []; map[a.cat].push(a); });
    return map;
  }, [filtered]);
  const lockedIds = useMemo(() => {
    if (userTier === 'pro') return new Set();
    const locked = new Set();
    const byCatAll = {};
    activities.forEach(a => { if (!byCatAll[a.cat]) byCatAll[a.cat] = []; byCatAll[a.cat].push(a); });
    Object.entries(byCatAll).forEach(([cat, items]) => {
      if (!MORNING_MEETING_CATS.has(cat)) items.slice(FREE_ACTIVITY_LIMIT).forEach(a => locked.add(a.id));
    });
    return locked;
  }, [activities, userTier]);
  return (
    <div className="routine-col" style={{ background: "var(--sand)" }}>
      <div className="browse-header">
        <div className="browse-head-row">
          <div>
            <div className="section-eyebrow">Library</div>
            <div style={{fontSize:14, color:"var(--muted)", marginTop:3}}>Choose a ready-to-use item, project it, or add it to your own routine.</div>
          </div>
          <button className="btn-secondary btn-compact" type="button" onClick={onCreate}>+ Create Activity</button>
        </div>
        <div className="library-grade-note">
          <span>Grade {grade}</span>
          <div><strong>Showing every library item.</strong> The grade picker updates Today, Word of the Day, and Do Now recommendations, but the Library stays complete.</div>
        </div>
        {replacementTarget && (
          <div className="library-replace-note" role="status">
            <div>
              <strong>Replacing {replacementTarget.title}</strong>
              Choose any library item. It will take the same spot in Today.
            </div>
            <button className="btn-secondary btn-compact" type="button" onClick={onCancelReplacement}>Cancel</button>
          </div>
        )}
        {!replacementTarget && <div className="library-pill-wrap">
          <div className="library-pill-row" aria-label="Library shortcuts">
            <button type="button" className="library-pill-btn primary" onClick={() => onOpenTool("Routines")}>Build a Routine</button>
            <button type="button" className="library-pill-btn" onClick={() => onOpenTool("Word of the Day")}>Word of the Day</button>
            <button type="button" className="library-pill-btn" onClick={() => onOpenTool("Do Now")}>Do Now</button>
            <button type="button" className="library-pill-btn" onClick={() => onOpenTool("On This Day")}>On This Day</button>
            <button type="button" className="library-pill-btn" onClick={() => onOpenTool("My Activities")}>My Activities</button>
            <button type="button" className="library-pill-btn" onClick={() => onOpenTool("Favorites")}>Favorites</button>
            <button type="button" className="library-pill-btn" onClick={() => onOpenTool("This Week")}>This Week</button>
          </div>
        </div>}
        {!replacementTarget && builderCount > 0 && (
          <div className="routine-tray">
            <span><strong>{builderCount}</strong> {builderCount === 1 ? "item" : "items"} saved in Build</span>
            <button className="btn-primary btn-compact" type="button" onClick={onReviewRoutine}>Open Build</button>
          </div>
        )}
        <div className="browse-search">
          <span style={{color:"var(--muted)", fontSize:16}}>🔍</span>
          <input placeholder="Search activities…" value={q} onChange={e => setQ(e.target.value)}/>
          {q && <span onClick={() => setQ("")} style={{cursor:"pointer", color:"var(--muted)", fontSize:14}}>✕</span>}
        </div>
      </div>
      <div className="browse-scroll">
        {Object.keys(byCat).length === 0 && (
          <div style={{textAlign:"center", color:"var(--muted)", padding:"48px 0", fontSize:15}}>No activities found</div>
        )}
        {Object.entries(byCat).map(([cat, items]) => {
          const cm = CAT_META[cat] || { color: "#CCC" };
          return (
            <div key={cat} className="browse-cat-section">
              <div className="browse-cat-label">
                <div className="browse-cat-dot" style={{ background: cm.color }}/>
                {cm.emoji} {cat}
              </div>
              <div className="browse-grid">
                {items.map(a => {
                  const locked = lockedIds.has(a.id);
                  return (
                    <div key={a.id} className={`browse-card${locked ? ' browse-card--locked' : ''}`} style={{ borderTop: `3px solid ${cm.color}` }}>
                      <div style={{display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8}}>
                        <div className="browse-card-title">{a.title}{usedToday?.has(a.id) && <span className="browse-card-used-badge">✓ Today</span>}</div>
                        {locked
                          ? <span className="browse-card-pro-badge">Pro</span>
                          : <button
                              className={`browse-card-heart${favorites.has(a.id) ? ' saved' : ''}`}
                              type="button"
                              aria-label={favorites.has(a.id) ? `Remove ${a.title} from favorites` : `Save ${a.title} to favorites`}
                              onClick={() => onFave(a)} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,flexShrink:0}}>
                              {favorites.has(a.id) ? "♥" : "♡"}
                            </button>
                        }
                      </div>
                      <div className="browse-card-meta">{a.meta}</div>
                      <div className="browse-card-actions">
                        <button className={replacementTarget ? "btn-primary btn-compact" : "btn-secondary btn-compact"} type="button" aria-label={replacementTarget ? `Replace ${replacementTarget.title} with ${a.title}` : `Use ${a.title} today`} onClick={() => locked ? onUpgradeNeeded?.() : onAdd(a)}>{replacementTarget ? "Replace" : "Use Today"}</button>
                        <button className="btn-secondary btn-compact" type="button" aria-label={`Add ${a.title} to routine builder`} onClick={() => locked ? onUpgradeNeeded?.() : onBuild(a)}>Add to Routine</button>
                        <button className="btn-secondary btn-compact" type="button" aria-label={`Project ${a.title}`} onClick={() => onDisplay(a)}>Project</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Vocabulary Screen ── */
function VocabularyScreen({ grade, word, words, onChoose, onCreate, onEdit, onDelete, onRefresh, onProject, onAddToRoutine }) {
  return (
    <div className="routine-col vocab-col">
      <div className="routine-header vocab-header">
        <div>
          <div className="section-eyebrow">Vocabulary Word of the Day</div>
          <div className="routine-ready">{grade} · Inspired by Vocabulary Ninja Word of the Day</div>
        </div>
        <div className="header-actions">
          <button className="btn-primary btn-compact" type="button" onClick={onProject}>Project</button>
          <button className="btn-secondary btn-compact" type="button" aria-label={`Add ${word.word} to routine builder`} onClick={onAddToRoutine}>Add to Routine</button>
          <button className="btn-secondary btn-compact" type="button" onClick={onCreate}>+ Add Word</button>
          <button className="btn-secondary btn-compact" type="button" onClick={onRefresh}>New Word</button>
        </div>
      </div>
      <div className="vocab-wrap split-wrap">
        <aside className="chooser-panel">
          <div className="chooser-title">Choose a Word</div>
          {words.map(item => (
            <div key={item.id || item.word} className={`chooser-card${item.word === word.word ? " active" : ""}`}>
              <button type="button" onClick={() => onChoose(item)}>
                <strong>{item.word}</strong>
                <span>{item.type}</span>
              </button>
              {item.custom && (
                <div className="chooser-actions">
                  <button type="button" onClick={() => onEdit(item)}>Edit</button>
                  <button type="button" onClick={() => onDelete(item)}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </aside>
        <div className="vocab-card">
          <div className="vocab-kicker">{word.type}</div>
          <div className="vocab-word">{word.word}</div>
          <div className="vocab-meaning">{word.meaning}</div>
          <div className="vocab-section">
            <div className="d-label">Example</div>
            <div className="vocab-example">“{word.example}”</div>
          </div>
          <div className="vocab-section">
            <div className="d-label">Try It</div>
            <div className="vocab-task">{word.tryIt}</div>
          </div>
          <div className="vocab-actions">
            <a className="source-link" href={VOCAB_SOURCE.url} target="_blank" rel="noreferrer">Source inspiration: {VOCAB_SOURCE.name}</a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Do Now Screen ── */
function DoNowScreen({ grade, subject, problem, problems, revealAnswer, onReveal, onRefresh, onSubjectChange, onChoose, onCreate, onEdit, onDelete, onProject, onAddToRoutine }) {
  const section = DO_NOW_SECTIONS[subject] || DO_NOW_SECTIONS.math;
  return (
    <div className="routine-col do-now-col">
      <div className="routine-header vocab-header">
        <div>
          <div className="section-eyebrow">Do Now</div>
          <div className="routine-ready">{section.label} · {grade}</div>
        </div>
        <div className="header-actions">
          <button className="btn-primary btn-compact" type="button" onClick={onProject}>Project</button>
          <button className="btn-secondary btn-compact" type="button" aria-label={`Add ${problem.title} to routine builder`} onClick={onAddToRoutine}>Add to Routine</button>
          <button className="btn-secondary btn-compact" type="button" onClick={onCreate}>{subject === "math" ? "+ Add Problem" : "+ Add Prompt"}</button>
          <button className="btn-secondary btn-compact" type="button" onClick={onRefresh}>New Prompt</button>
        </div>
      </div>
      <div className="do-now-layout">
        <aside className="subnav">
          {Object.entries(DO_NOW_SECTIONS).map(([key, item]) => (
            <button
              key={key}
              className={`subnav-item${key === subject ? " active" : ""}`}
              type="button"
              disabled={!item.enabled}
              onClick={() => onSubjectChange(key)}
            >
              {item.label}
            </button>
          ))}
        </aside>
        <div className="chooser-panel">
          <div className="chooser-title">{subject === "math" ? "Choose a Problem" : "Choose a Prompt"}</div>
          {problems.map(item => (
            <div key={item.id || item.title} className={`chooser-card${item.title === problem.title ? " active" : ""}`}>
              <button type="button" onClick={() => onChoose(item)}>
                <strong>{item.title}</strong>
                <span>{item.problem}</span>
              </button>
              {item.custom && (
                <div className="chooser-actions">
                  <button type="button" onClick={() => onEdit(item)}>Edit</button>
                  <button type="button" onClick={() => onDelete(item)}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="math-card">
          <div className="vocab-kicker">{section.eyebrow || section.label}</div>
          <div className="math-title">{problem.title}</div>
          <div className="math-problem">{problem.problem}</div>
          <div className="vocab-section">
            <div className="d-label">Hint</div>
            <div className="vocab-task">{problem.hint}</div>
          </div>
          <div className="vocab-section">
            <div className="d-label">Answer</div>
            {revealAnswer
              ? <div className="math-answer">{problem.answer}</div>
              : <button className="btn-primary" type="button" onClick={onReveal}>Reveal Answer</button>
            }
          </div>
          <div className="vocab-section">
            <div className="d-label">Teacher Note</div>
            <div className="vocab-example">{problem.teacherNote}</div>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ── On This Day Screen ── */
function OnThisDayScreen({ dateLabel, items, selectedItem, loading, source, sourceUrl, onChoose, onRefresh, onProject, onAddToRoutine }) {
  const active = selectedItem || items[0];
  return (
    <div className="routine-col history-col">
      <div className="routine-header vocab-header">
        <div>
          <div className="section-eyebrow">On This Day</div>
          <div className="routine-ready">{dateLabel} · {source}</div>
        </div>
        <div className="header-actions">
          <button className="btn-primary btn-compact" type="button" onClick={onProject}>Project</button>
          <button className="btn-secondary btn-compact" type="button" aria-label={active ? `Add ${active.title} to routine builder` : "Add moment to routine builder"} onClick={() => active && onAddToRoutine(active)}>Add to Routine</button>
          <button className="btn-secondary btn-compact" type="button" onClick={onRefresh}>Refresh</button>
        </div>
      </div>
      <div className="history-layout">
        <aside className="history-list-card">
          <div className="chooser-title">Choose a Moment</div>
          {loading && <div className="history-status" style={{padding:"8px 6px 12px"}}>Loading from OnThisDay...</div>}
          {items.map(item => (
            <button
              key={item.year + item.title}
              className={`history-item${active && active.title === item.title && active.year === item.year ? " active" : ""}`}
              type="button"
              onClick={() => onChoose(item)}
            >
              <div className="history-item-year">{item.year}</div>
              <div className="history-item-title">{item.title}</div>
            </button>
          ))}
        </aside>
        <div className="history-feature-card">
          <div className="history-kicker">{active?.category || "History"}</div>
          <div className="history-year">{active?.year}</div>
          <div className="history-title">{active?.title}</div>
          <div className="history-prompt">{active ? historyPrompt(active) : ""}</div>
          <div className="history-source">
            Source: <a className="source-link" href={sourceUrl || ON_THIS_DAY_SOURCE.url} target="_blank" rel="noreferrer">{source}</a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── My Activities Screen ── */
function MyActivitiesScreen({ customActivities, onCreate, onEdit, onDelete, onAdd, onBuild }) {
  if (customActivities.length === 0) {
    return (
      <div className="routine-col">
        <div className="routine-header">
          <div className="section-eyebrow">My Activities</div>
        </div>
        <div className="faves-empty">
          <div className="faves-empty-icon">＋</div>
          <div className="faves-empty-text">Create your first reusable activity for quick access.</div>
          <button className="btn-primary btn-empty-action" type="button" onClick={onCreate}>Create Activity</button>
        </div>
      </div>
    );
  }
  return (
    <div className="routine-col" style={{ background: "var(--sand)" }}>
      <div className="browse-header">
        <div className="browse-head-row">
          <div>
            <div className="section-eyebrow">My Activities</div>
            <div style={{fontSize:14, color:"var(--muted)", marginTop:3}}>{customActivities.length} custom {customActivities.length===1?"activity":"activities"}</div>
          </div>
          <button className="btn-secondary btn-compact" type="button" onClick={onCreate}>+ Create Activity</button>
        </div>
      </div>
      <div className="browse-scroll">
        <div className="manage-grid">
          {customActivities.map(a => {
            const cm = CAT_META[a.cat] || { color: "#CCC" };
            return (
              <div key={a.id} className="manage-card" style={{ borderTop: `3px solid ${cm.color}` }}>
                <div className="browse-card-title">{a.title}</div>
                <div className="browse-card-meta">{a.cat} · {a.meta}</div>
                <div className="manage-actions">
                  <button className="btn-secondary btn-compact" type="button" aria-label={`Use ${a.title} today`} onClick={() => onAdd(a)}>Use Today</button>
                  <button className="btn-secondary btn-compact" type="button" aria-label={`Add ${a.title} to routine builder`} onClick={() => onBuild(a)}>Add to Routine</button>
                  <button className="btn-secondary btn-compact" type="button" onClick={() => onEdit(a)}>Edit</button>
                  <button className="btn-danger btn-compact" type="button" onClick={() => onDelete(a)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


/* ── Routine Builder Screen ── */
function RoutineBuilderScreen({ draft, routines = [], onDraftChange, onSaveRoutine, onLoadToday, onProject, onOpenLibrary, onLoadSaved, onEditSaved, onProjectSaved, onDeleteSaved, onCopySaved }) {
  const name = draft.name ?? "My Classroom Routine";
  const items = draft.items || [];
  const [customText, setCustomText] = useState("");
  const [timerMinutes, setTimerMinutes] = useState(3);
  const totalMin = Math.max(0, Math.round(items.reduce((sum, item) => sum + (item.time || 0), 0) / 60));
  const isEditingSavedRoutine = !!draft.editingRoutineId;
  const updateItems = nextItems => onDraftChange({ ...draft, items: nextItems });
  const setName = nextName => onDraftChange({ ...draft, name: nextName });
  const addItem = activity => updateItems([...items, { ...activity, builderKey: "block-" + Date.now() + "-" + Math.random().toString(16).slice(2) }]);
  const addCustomText = () => {
    const prompt = customText.trim();
    if (!prompt) return;
    addItem({
      id: "teacher-note-" + Date.now(),
      custom: true,
      cat: "Teacher Note",
      title: "Teacher Message",
      meta: "2 min · Calm",
      time: 120,
      prompt,
      starter: "",
      directions: "A custom message or instruction created by the teacher."
    });
    setCustomText("");
  };
  const addTimer = () => {
    const minutes = Math.max(1, Math.min(60, Number(timerMinutes) || 3));
    addItem({
      id: "timer-" + Date.now(),
      custom: true,
      cat: "Timer",
      title: minutes + "-Minute Timer",
      meta: minutes + " min · Calm",
      time: minutes * 60,
      prompt: "Work quietly for " + minutes + " minutes.",
      starter: "",
      directions: "Use this as a standalone projected timer block."
    });
  };
  const moveItem = (index, direction) => {
    const next = [...items];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    updateItems(next);
  };
  const removeItem = index => updateItems(items.filter((_, i) => i !== index));
  const duplicateItem = index => {
    const item = items[index];
    if (!item) return;
    const copy = { ...item, id: item.custom ? item.id + "-copy-" + Date.now() : item.id, builderKey: "block-" + Date.now() + "-" + Math.random().toString(16).slice(2) };
    updateItems([...items.slice(0, index + 1), copy, ...items.slice(index + 1)]);
  };
  const clear = () => onDraftChange({ name: "My Classroom Routine", items: [] });
  const save = () => {
    if (!items.length) return;
    onSaveRoutine({ id: draft.editingRoutineId, name: name.trim() || "Untitled Routine", items });
  };

  return (
    <div className="routine-col builder-col">
      <div className="routine-header builder-header">
        <div>
          <div className="section-eyebrow">My Routines</div>
          <div className="routine-ready">{isEditingSavedRoutine ? "Editing saved routine · " : ""}{items.length ? items.length + " items · ~" + totalMin + " min" : "Build from scratch or choose from the Library."}</div>
        </div>
        <div className="header-actions">
          <button className="btn-primary btn-compact" type="button" onClick={onOpenLibrary}>Browse Library</button>
          <button className="btn-secondary btn-compact" type="button" disabled={!items.length} onClick={clear}>Clear</button>
          <button className="btn-secondary btn-compact" type="button" disabled={!items.length} onClick={() => onLoadToday(items)}>Use Today</button>
          <button className="btn-primary btn-compact" type="button" disabled={!items.length} onClick={() => onProject(items)}>Project</button>
        </div>
      </div>
      <div className="cards-scroll">
        <div className="builder-panel builder-current" style={{width:"100%"}}>
          <div className="builder-current-top">
            <label className="form-field builder-name-field"><span>Routine Name</span><input value={name} onChange={e => setName(e.target.value)} /></label>
            <button className="btn-primary btn-compact" type="button" disabled={!items.length} onClick={save}>{isEditingSavedRoutine ? "Update Routine" : "Save Routine"}</button>
          </div>
          {items.length === 0 ? (
            <div className="builder-empty">
              <strong>Start with anything.</strong>
              <span style={{display:"block", marginTop:8}}>Add meeting activities, writing prompts, vocab, math, On This Day, your own text, and timers. This is where teachers build their own ritual from the ground up.</span>
              <button className="btn-primary btn-compact" type="button" style={{marginTop:16}} onClick={onOpenLibrary}>Browse Library</button>
            </div>
          ) : (
            <div className="builder-block-list">
              {items.map((item, index) => {
                const cm = CAT_META[item.cat] || { color: "#CCC", emoji: "" };
                return (
                  <div key={item.builderKey || item.id + "-" + index} className="builder-block" style={{ borderTopColor: cm.color }}>
                    <div className="builder-block-index">{index + 1}</div>
                    <div className="builder-block-main">
                      <div className="builder-block-cat">{cm.emoji} {item.cat}</div>
                      <div className="builder-block-title">{item.title}</div>
                      <div className="builder-block-prompt">{item.prompt}</div>
                    </div>
                    <div className="builder-block-actions">
                      <button type="button" onClick={() => moveItem(index, -1)} disabled={index === 0}>Up</button>
                      <button type="button" onClick={() => moveItem(index, 1)} disabled={index === items.length - 1}>Down</button>
                      <button type="button" onClick={() => duplicateItem(index)}>Copy</button>
                      <button type="button" className="danger" onClick={() => removeItem(index)}>Remove</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="builder-panel" style={{width:"100%"}}>
          <div className="builder-panel-title">Teacher-Created Blocks</div>
          <div className="builder-custom-box">
            <div className="builder-mini-title">Custom Text</div>
            <textarea rows="3" value={customText} onChange={e => setCustomText(e.target.value)} placeholder="Type your own prompt, instruction, or message."/>
            <button className="btn-secondary btn-compact" type="button" onClick={addCustomText}>Add Text Block</button>
          </div>
          <div className="builder-custom-box compact">
            <div className="builder-mini-title">Timer Block</div>
            <div className="builder-timer-row">
              <input type="number" min="1" max="60" value={timerMinutes} onChange={e => setTimerMinutes(e.target.value)}/>
              <button className="btn-secondary btn-compact" type="button" onClick={addTimer}>Add Timer</button>
            </div>
          </div>
        </div>
        <div className="builder-panel saved-routines-panel" style={{width:"100%"}}>
          <div className="builder-panel-title">Saved Routines</div>
          {routines.length === 0 ? (
            <div className="builder-empty small" style={{textAlign:"left"}}>No saved routines yet. Build one above, then save it for tomorrow.</div>
          ) : (
            <div className="routine-hub-list">
              {routines.map(r => (
                <div key={r.id} className="routine-hub-card">
                  <div>
                    <div className="browse-card-title">{r.name}</div>
                    <div className="browse-card-meta">{new Date(r.savedAt).toLocaleDateString()} · {r.items.length} items · ~{Math.round(r.items.reduce((s,a)=>s+a.time,0)/60)} min</div>
                    <div className="routine-mini-list">{r.items.slice(0, 5).map(a => <span key={a.id}>{a.title}</span>)}</div>
                  </div>
                  <div className="manage-actions routine-hub-actions">
                    <button className="btn-secondary btn-compact" type="button" aria-label={`Use ${r.name} today`} onClick={() => onLoadSaved(r)}>Use Today</button>
                    <button className="btn-secondary btn-compact" type="button" aria-label={`Edit ${r.name}`} onClick={() => onEditSaved(r)}>Edit</button>
                    <button className="btn-primary btn-compact" type="button" aria-label={`Project ${r.name}`} onClick={() => onProjectSaved(r)}>Project</button>
                    <button className="btn-secondary btn-compact" type="button" onClick={() => onCopySaved(r)}>Summary</button>
                    <button className="btn-danger btn-compact" type="button" onClick={() => onDeleteSaved(r)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BuildScreen({ customActivities, onCreateActivity, onEditActivity, onDeleteActivity, onAddActivityToday, onBuildActivity, routineProps }) {
  return (
    <div className="build-workspace">
      <div className="build-section">
        <div className="build-section-title">Activity Builder</div>
        <MyActivitiesScreen
          customActivities={customActivities}
          onCreate={onCreateActivity}
          onEdit={onEditActivity}
          onDelete={onDeleteActivity}
          onAdd={onAddActivityToday}
          onBuild={onBuildActivity}
        />
      </div>
      <div className="build-section">
        <div className="build-section-title">Routine Builder</div>
        <RoutineBuilderScreen {...routineProps}/>
      </div>
    </div>
  );
}

/* ── Saved Routines Screen ── */
function SavedRoutinesScreen({ routines, onLoad, onEdit, onProject, onDelete, onCopy }) {
  if (routines.length === 0) {
    return (
      <div className="routine-col">
        <div className="routine-header">
          <div className="section-eyebrow">Routines</div>
        </div>
        <div className="faves-empty">
          <div className="faves-empty-icon">☆</div>
          <div className="faves-empty-text">Save or build a routine to reuse it later.</div>
        </div>
      </div>
    );
  }
  return (
    <div className="routine-col" style={{ background: "var(--sand)" }}>
      <div className="browse-header">
        <div className="section-eyebrow">Routines</div>
        <div style={{fontSize:14, color:"var(--muted)", marginTop:3}}>{routines.length} saved</div>
      </div>
      <div className="browse-scroll">
        <div className="manage-grid">
          {routines.map(r => (
            <div key={r.id} className="manage-card">
              <div className="browse-card-title">{r.name}</div>
              <div className="browse-card-meta">{new Date(r.savedAt).toLocaleDateString()} · {r.items.length} activities · ~{Math.round(r.items.reduce((s,a)=>s+a.time,0)/60)} min</div>
              <div className="routine-mini-list">{r.items.map(a => <span key={a.id}>{a.title}</span>)}</div>
              <div className="manage-actions">
                <button className="btn-secondary btn-compact" type="button" aria-label={`Use ${r.name} today`} onClick={() => onLoad(r)}>Use Today</button>
                <button className="btn-secondary btn-compact" type="button" aria-label={`Edit ${r.name}`} onClick={() => onEdit(r)}>Edit</button>
                <button className="btn-secondary btn-compact" type="button" aria-label={`Project ${r.name}`} onClick={() => onProject(r)}>Project</button>
                <button className="btn-secondary btn-compact" type="button" onClick={() => onCopy(r)}>Summary</button>
                <button className="btn-danger btn-compact" type="button" onClick={() => onDelete(r)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Favorites Screen ── */
function FavoritesScreen({ activities, favorites, onFave, onAdd, onBuild, onDisplay }) {
  const faveItems = activities.filter(a => favorites?.has(a.id));
  if (faveItems.length === 0) {
    return (
      <div className="routine-col">
        <div className="routine-header">
          <div className="section-eyebrow">Favorites</div>
        </div>
        <div className="faves-empty">
          <div className="faves-empty-icon">♡</div>
          <div className="faves-empty-text">Tap the heart on any activity to save it here for quick access</div>
        </div>
      </div>
    );
  }
  const byCat = {};
  faveItems.forEach(a => { if (!byCat[a.cat]) byCat[a.cat] = []; byCat[a.cat].push(a); });
  return (
    <div className="routine-col" style={{ background: "var(--sand)" }}>
      <div className="browse-header">
        <div className="section-eyebrow">Favorites</div>
        <div style={{fontSize:14, color:"var(--muted)", marginTop:3}}>{faveItems.length} saved {faveItems.length===1?"activity":"activities"}</div>
      </div>
      <div className="browse-scroll">
        {Object.entries(byCat).map(([cat, items]) => {
          const cm = CAT_META[cat] || { color: "#CCC" };
          return (
            <div key={cat} className="browse-cat-section">
              <div className="browse-cat-label">
                <div className="browse-cat-dot" style={{ background: cm.color }}/>
                {cm.emoji} {cat}
              </div>
              <div className="browse-grid">
                {items.map(a => (
                  <div key={a.id} className="browse-card" style={{ borderTop: `3px solid ${cm.color}` }}>
                    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
                      <div className="browse-card-title">{a.title}</div>
                      <button type="button" aria-label={`Remove ${a.title} from favorites`} onClick={() => onFave(a)} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:"#E05C7A",flexShrink:0}}>♥</button>
                    </div>
                    <div className="browse-card-meta">{a.meta}</div>
                    <div className="browse-card-actions">
                      <button className="btn-secondary btn-compact" type="button" aria-label={`Use ${a.title} today`} onClick={() => onAdd(a)}>Use Today</button>
                      <button className="btn-secondary btn-compact" type="button" aria-label={`Add ${a.title} to routine builder`} onClick={() => onBuild(a)}>Add to Routine</button>
                      <button className="btn-secondary btn-compact" type="button" aria-label={`Project ${a.title}`} onClick={() => onDisplay(a)}>Project</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── This Week Screen ── */
function ThisWeekScreen({ activities, usedThisWeek, onAdd, onBuild, onDisplay }) {
  const weekItems = activities.filter(a => usedThisWeek?.has(a.id));
  if (weekItems.length === 0) {
    return (
      <div className="routine-col">
        <div className="routine-header">
          <div className="section-eyebrow">This Week</div>
        </div>
        <div className="faves-empty">
          <div className="faves-empty-icon">📅</div>
          <div className="faves-empty-text">Activities you project this week will appear here — helps you plan variety and avoid repeats</div>
        </div>
      </div>
    );
  }
  const byCat = {};
  weekItems.forEach(a => { if (!byCat[a.cat]) byCat[a.cat] = []; byCat[a.cat].push(a); });
  return (
    <div className="routine-col" style={{ background: "var(--sand)" }}>
      <div className="browse-header">
        <div className="section-eyebrow">This Week</div>
        <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 3 }}>
          {weekItems.length} {weekItems.length === 1 ? "activity" : "activities"} used · resets Monday
        </div>
      </div>
      <div className="browse-scroll">
        {Object.entries(byCat).map(([cat, items]) => {
          const cm = CAT_META[cat] || { color: "#CCC", emoji: "" };
          return (
            <div key={cat} className="browse-cat-section">
              <div className="browse-cat-label">
                <div className="browse-cat-dot" style={{ background: cm.color }} />
                {cm.emoji} {cat}
              </div>
              <div className="browse-grid">
                {items.map(a => (
                  <div key={a.id} className="browse-card" style={{ borderTop: `3px solid ${cm.color}` }}>
                    <div className="browse-card-title">{a.title}</div>
                    <div className="browse-card-meta">{a.meta}</div>
                    <div className="browse-card-actions">
                      <button className="btn-secondary btn-compact" type="button" onClick={() => onAdd(a)}>Use Today</button>
                      <button className="btn-secondary btn-compact" type="button" onClick={() => onBuild(a)}>Add to Routine</button>
                      <button className="btn-secondary btn-compact" type="button" onClick={() => onDisplay(a)}>Project</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UpgradeModal({ feature, onClose }) {
  return (
    <div className="overlay dialog-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="filter-sheet upgrade-modal-sheet" role="dialog" aria-modal="true">
        <div className="sheet-handle" />
        <div className="sheet-title">Upgrade to Pro</div>
        <div className="sheet-body">
          <p className="upgrade-gate-reason">{feature}</p>
          <ul className="upgrade-perks">
            <li>Unlimited saved routines &amp; custom activities</li>
            <li>Projector &amp; fullscreen mode</li>
            <li>All grade bands &amp; category filters</li>
            <li>Custom vocabulary &amp; Do Now</li>
          </ul>
          <div className="upgrade-price">$9 / month &nbsp;·&nbsp; $79 / year</div>
        </div>
        <div className="sheet-footer">
          <button className="btn-primary" type="button" onClick={() => { onClose(); window.location.href = '/upgrade'; }}>Upgrade to Pro</button>
          <button className="btn-secondary" type="button" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════
   MAIN APP
════════════════════════════════ */
function MainApp({ account, onSignOut }) {
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "grade": account?.grade || "3",
    "time": "15 min",
    "energy": "Medium",
    "teacherName": "Mike"
  }/*EDITMODE-END*/;
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  const initialFilters = {
    grade: account?.grade || tweaks.grade,
    time: tweaks.time,
    energy: tweaks.energy,
    cats: DEFAULT_CATS
  };
  const initialCustomActivities = useMemo(() => readStoredCustomActivities(), []);
  const [customActivities, setCustomActivities] = useState(initialCustomActivities);
  const [savedRoutines, setSavedRoutines] = useState(() => readSavedRoutines());
  const [editingActivity, setEditingActivity] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [routine, setRoutine] = useState(() => pickRoutine(initialFilters, [...POOL, ...initialCustomActivities]));
  const [selected, setSelected] = useState(() => routine[0] || null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [displayName, setDisplayName] = useState(account?.name || '');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem('ofd:sidebarCollapsed') === '1'; } catch { return false; }
  });
  const [customOpen, setCustomOpen] = useState(false);
  const [favorites, setFavorites] = useState(() => readStoredFavorites());
  const [usedToday, setUsedToday] = useState(() => readUsedToday());
  const [usedThisWeek, setUsedThisWeek] = useState(() => readUsedThisWeek());
  const [seenActivities, setSeenActivities] = useState(() => readSeenActivities());
  const [projectorStyle, setProjectorStyle] = useState(() => readProjectorStyle(account));
  const todayLabel = useMemo(() => formatToday(), []);
  const currentGrade = filters.grade || account?.grade || tweaks.grade;
  const [customVocab, setCustomVocab] = useState(() => readCustomVocab());
  const [customDoNow, setCustomDoNow] = useState(() => readCustomDoNow());
  const [activityPool, setActivityPool] = useState(POOL);
  const effectivePlan = usePlan(account);
  const isPlanFree = effectivePlan === 'free';
  const [upgradeModalFor, setUpgradeModalFor] = useState(null);
  const userTier = effectivePlan === 'pro' ? 'pro' : 'free';

  const trialDaysLeft = useMemo(() => {
    if (account?.tier === 'pro') return null;
    if (account?.plan !== 'trial') return null;
    const startedMs = tsToMs(account?.trialStartedAt);
    if (startedMs == null) return 14;
    const ms = 14 * 24 * 60 * 60 * 1000 - (Date.now() - startedMs);
    return ms > 0 ? Math.ceil(ms / (24 * 60 * 60 * 1000)) : 0;
  }, [account]);
  const [trialBannerDismissed, setTrialBannerDismissed] = useState(
    () => sessionStorage.getItem('trial-banner-dismissed') === '1'
  );
  const showTrialBanner = trialDaysLeft !== null && !trialBannerDismissed;
  function dismissTrialBanner() {
    sessionStorage.setItem('trial-banner-dismissed', '1');
    setTrialBannerDismissed(true);
  }
  const [showProBanner, setShowProBanner] = useState(() => new URLSearchParams(window.location.search).get('upgraded') === 'true');

  const [streakCount] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    try {
      const raw = localStorage.getItem('ofd:streak');
      let s = raw ? JSON.parse(raw) : { count: 0, lastDate: null };
      if (s.lastDate === today) return s.count;
      const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      s = s.lastDate === yest ? { count: s.count + 1, lastDate: today } : { count: 1, lastDate: today };
      localStorage.setItem('ofd:streak', JSON.stringify(s));
      return s.count;
    } catch { return 1; }
  });
  const STREAK_MILESTONES = { 3: "3 days in a row! A habit is forming. 🔥", 7: "One full week of great mornings! 🏆", 14: "14-day streak — two weeks strong. 💪", 30: "30 days! A full month of classroom magic. 🎉" };
  useEffect(() => {
    if (!showProBanner) return;
    window.history.replaceState({}, '', window.location.pathname);
    const t = setTimeout(() => setShowProBanner(false), 5000);
    return () => clearTimeout(t);
  }, [showProBanner]);
  const [verifyBannerDismissed, setVerifyBannerDismissed] = useState(() => sessionStorage.getItem('verify-banner-dismissed') === '1');
  const showVerifyBanner = account?.emailVerified === false && !verifyBannerDismissed;
  const [verifySent, setVerifySent] = useState(false);
  const resendVerification = useCallback(async () => {
    try {
      if (auth.currentUser) await sendEmailVerification(auth.currentUser);
      setVerifySent(true);
    } catch {}
  }, []);
  function dismissVerifyBanner() {
    sessionStorage.setItem('verify-banner-dismissed', '1');
    setVerifyBannerDismissed(true);
  }
  useEffect(() => {
    fetchActivities().then(remote => {
      if (remote.length > 0) setActivityPool(remote);
    }).catch(() => {});
  }, []);
  const contentActivities = useMemo(() => buildContentActivities(currentGrade, customVocab, customDoNow), [currentGrade, customVocab, customDoNow]);
  const allActivities = useMemo(() => [...activityPool, ...customActivities, ...contentActivities], [activityPool, customActivities, contentActivities]);
  const libraryActivities = useMemo(() => buildLibraryActivities(customActivities, customVocab, customDoNow, activityPool), [activityPool, customActivities, customVocab, customDoNow]);
  const [wordEditorOpen, setWordEditorOpen] = useState(false);
  const [editingWord, setEditingWord] = useState(null);
  const [doNowEditorOpen, setDoNowEditorOpen] = useState(false);
  const [editingDoNow, setEditingDoNow] = useState(null);
  const [vocabOffset, setVocabOffset] = useState(0);
  const vocabWords = useMemo(() => getVocabBank(currentGrade, customVocab), [currentGrade, customVocab]);
  const [selectedVocabWord, setSelectedVocabWord] = useState(null);
  const vocabWord = selectedVocabWord || pickDailyVocab(currentGrade, vocabOffset, customVocab);
  const [doNowSubject, setDoNowSubject] = useState("math");
  const [doNowOffset, setDoNowOffset] = useState(0);
  const [doNowAnswerVisible, setDoNowAnswerVisible] = useState(false);
  const doNowProblems = useMemo(() => getDoNowBank(doNowSubject, currentGrade, customDoNow), [doNowSubject, currentGrade, customDoNow]);
  const [selectedDoNowProblem, setSelectedDoNowProblem] = useState(null);
  const doNowProblem = selectedDoNowProblem || pickDailyDoNow(doNowSubject, currentGrade, doNowOffset, customDoNow);
  const [displayMode, setDisplayMode] = useState(null);
  const [projectedToday, setProjectedToday] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    try { return localStorage.getItem('ofd:projectedToday') === today; } catch { return false; }
  });
  const projectedYesterday = useMemo(() => {
    const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    try { return localStorage.getItem('ofd:projectedToday') === yest; } catch { return false; }
  }, []);
  const isFriday = new Date().getDay() === 5;
  const midnightResetLabel = useMemo(() => {
    const now = new Date();
    const midnight = new Date(now); midnight.setHours(24, 0, 0, 0);
    const h = Math.floor((midnight - now) / 3600000);
    const m = Math.floor(((midnight - now) % 3600000) / 60000);
    if (h >= 1) return `Refreshes in ${h}h ${m}m`;
    return `Refreshes in ${m}m`;
  }, []);
  const [historyItems, setHistoryItems] = useState(() => getFallbackHistory());
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySource, setHistorySource] = useState("Built-in classroom fallback");
  const [historySourceUrl, setHistorySourceUrl] = useState(() => onThisDayUrl());
  const [activeNav, setActiveNav] = useState("Today");
  const [showWelcome, setShowWelcome] = useState(
    () => !localStorage.getItem(`ofd:welcomed:${account?.uid}`)
  );
  const [builderDraft, setBuilderDraft] = useState({ name: "My Classroom Routine", items: [] });
  const [replacementTarget, setReplacementTarget] = useState(null);
  const { toasts, show: showToast } = useToast();
  useEffect(() => {
    const msg = STREAK_MILESTONES[streakCount];
    if (!msg) return;
    try {
      const seen = JSON.parse(localStorage.getItem('ofd:streakMilestones') || '[]');
      if (seen.includes(streakCount)) return;
      localStorage.setItem('ofd:streakMilestones', JSON.stringify([...seen, streakCount]));
    } catch {}
    showToast(`🔥 ${msg}`);
  }, [streakCount, showToast]);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [cloudStatus, setCloudStatus] = useState("");
  const [cloudAutoSave, setCloudAutoSave] = useState(() => localStorage.getItem("ofd:cloudAutoSave") === "true");
  const cloudReadyRef = useRef(false);
  const projectorRef = useRef(null);
  const slideProjectorRef = useRef(null);
  const [projectorConnected, setProjectorConnected] = useState(false);
  const [savedBehavioralExpectations, setSavedBehavioralExpectations] = useState(
    () => (account?.behavioralExpectations || [])
  );
  const [presentationChoice, setPresentationChoice] = useState(null);
  const [presentationViewDefault, setPresentationViewDefault] = useState(() => readPresentationView());

  const projectToWindow = useCallback((items, startIndex = 0, presentationView = null) => {
    const list = Array.isArray(items) ? items.filter(Boolean) : [];
    if (!list.length) return;
    if (!presentationView) {
      setPresentationChoice({ items: list, startIndex });
      return;
    }
    const safePresentationView = presentationView === "guided" ? "guided" : "clean";
    const state = {
      active: true,
      routine: list,
      startIndex,
      presentationView: safePresentationView,
      projectorStyle,
      updatedAt: Date.now()
    };
    try {
      localStorage.setItem(PRESENTATION_VIEW_KEY, safePresentationView);
      localStorage.setItem(PROJECTOR_STATE_KEY, JSON.stringify(state));
    } catch {}
    const existing = projectorRef.current;
    if (!existing || existing.closed) {
      const opened = window.open(projectorWindowUrl(), "ofdProjector", "popup=yes,width=1280,height=800");
      if (!opened) {
        showToast("Allow popups to open the projector window");
        return;
      }
      projectorRef.current = opened;
    } else {
      existing.focus();
    }
    setProjectorConnected(true);
    setPresentationViewDefault(safePresentationView);
    showToast(`${safePresentationView === "guided" ? "Guided View" : "Clean View"} projected`);
  }, [projectorStyle, showToast]);

  const choosePresentationView = useCallback(view => {
    if (!presentationChoice) return;
    const request = presentationChoice;
    setPresentationChoice(null);
    projectToWindow(request.items, request.startIndex, view);
  }, [presentationChoice, projectToWindow]);

  const stopProjector = useCallback(() => {
    try {
      localStorage.setItem(PROJECTOR_STATE_KEY, JSON.stringify({ active: false, updatedAt: Date.now() }));
    } catch {}
    try {
      if (projectorRef.current && !projectorRef.current.closed) projectorRef.current.close();
    } catch {}
    projectorRef.current = null;
    setProjectorConnected(false);
    showToast("Projector stopped");
  }, [showToast]);

  const projectSlideToWindow = useCallback((slide) => {
    try { localStorage.setItem(SLIDE_PROJECTOR_KEY, JSON.stringify(slide)); } catch {}
    const url = new URL(window.location.href);
    url.searchParams.set('slideProjector', '1');
    url.hash = '';
    const existing = slideProjectorRef.current;
    if (!existing || existing.closed) {
      const opened = window.open(url.toString(), 'ofdSlideProjector', 'popup=yes,width=1280,height=800');
      if (!opened) { showToast('Allow popups to open the projector'); return; }
      slideProjectorRef.current = opened;
    } else {
      try { localStorage.setItem(SLIDE_PROJECTOR_KEY, JSON.stringify(slide)); } catch {}
      existing.focus();
    }
    showToast('Slide projected');
  }, [showToast]);

  useEffect(() => {
    if (!projectorConnected) return;
    const timer = setInterval(() => {
      const projector = projectorRef.current;
      if (!projector || projector.closed) {
        projectorRef.current = null;
        setProjectorConnected(false);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [projectorConnected]);

  const buildDataSnapshot = useCallback(() => ({
    version: 1,
    exportedAt: new Date().toISOString(),
    favorites: [...favorites],
    customActivities,
    savedRoutines,
    customVocab,
    customDoNow,
    projectorStyle
  }), [account, favorites, customActivities, savedRoutines, customVocab, customDoNow, projectorStyle]);

  const applyDataSnapshot = useCallback(data => {
    if (!data || data.version !== 1) throw new Error("Unsupported data version.");
    const nextFavorites = new Set(Array.isArray(data.favorites) ? data.favorites : []);
    const nextActivities = Array.isArray(data.customActivities) ? data.customActivities : [];
    const nextRoutines = Array.isArray(data.savedRoutines) ? data.savedRoutines : [];
    const nextVocab = data.customVocab && typeof data.customVocab === "object" ? data.customVocab : {};
    const nextDoNow = data.customDoNow && typeof data.customDoNow === "object" ? data.customDoNow : {};
    const nextProjectorStyle = normalizeProjectorStyle(data.projectorStyle || {}, account);

    setFavorites(nextFavorites);
    setCustomActivities(nextActivities);
    setSavedRoutines(nextRoutines);
    setCustomVocab(nextVocab);
    setCustomDoNow(nextDoNow);
    setProjectorStyle(nextProjectorStyle);
    localStorage.setItem("ofd:favorites", JSON.stringify([...nextFavorites]));
    persistCustomActivities(nextActivities);
    persistSavedRoutines(nextRoutines);
    persistCustomVocab(nextVocab);
    persistCustomDoNow(nextDoNow);
    persistProjectorStyle(nextProjectorStyle);
  }, [account]);

  const saveToCloud = useCallback(async ({ quiet = false } = {}) => {
    if (!account?.uid) return;
    if (!quiet) setCloudBusy(true);
    setCloudStatus(quiet ? "Auto-saving to cloud..." : "Saving to cloud...");
    try {
      const result = await saveDataSnapshot(account.uid, buildDataSnapshot());
      const savedAt = result.savedAt ? new Date(result.savedAt).toLocaleString() : "just now";
      setCloudStatus(`Saved to cloud ${savedAt}`);
      if (!quiet) showToast("Cloud database saved");
    } catch (error) {
      setCloudStatus(`Cloud save failed: ${error.message}`);
      if (!quiet) showToast("Cloud save failed");
    } finally {
      if (!quiet) setCloudBusy(false);
    }
  }, [account, buildDataSnapshot, showToast]);

  useEffect(() => {
    localStorage.setItem("ofd:cloudAutoSave", cloudAutoSave ? "true" : "false");
    if (cloudAutoSave) setCloudStatus(s => s || "Auto-save is on");
  }, [cloudAutoSave]);

  useEffect(() => {
    if (!cloudAutoSave) {
      cloudReadyRef.current = true;
      return;
    }
    if (!cloudReadyRef.current) {
      cloudReadyRef.current = true;
      return;
    }
    const timer = setTimeout(() => saveToCloud({ quiet: true }), 1800);
    return () => clearTimeout(timer);
  }, [cloudAutoSave, buildDataSnapshot, saveToCloud]);

  useEffect(() => {
    if (!routine.length) return;
    const ids = routine.map(a => a.id);
    recordUsedToday(ids);
    setUsedToday(readUsedToday());
    recordUsedThisWeek(ids);
    setUsedThisWeek(readUsedThisWeek());
  }, [routine]);

  const restoreFromCloud = useCallback(async () => {
    if (!account?.uid) return;
    if (!confirm("Restore cloud data to this device? This will replace the local custom data currently in this browser.")) return;
    setCloudBusy(true);
    setCloudStatus("Restoring cloud data...");
    try {
      const data = await loadDataSnapshot(account.uid);
      if (!data) throw new Error("No cloud data found for this profile.");
      applyDataSnapshot(data);
      setSettingsOpen(false);
      setCloudStatus("Restored cloud data to this device");
      showToast("Restored cloud data");
    } catch (error) {
      setCloudStatus(`Cloud restore failed: ${error.message}`);
      showToast("Cloud restore failed");
    } finally {
      setCloudBusy(false);
    }
  }, [account, applyDataSnapshot, showToast]);

  const addToToday = useCallback(activity => {
    if (replacementTarget) {
      setRoutine(r => r.map(item => item.id === replacementTarget.id ? activity : item));
      setSelected(activity);
      setReplacementTarget(null);
      setActiveNav("Today");
      showToast("Activity replaced");
      return;
    }
    setRoutine(r => [...r, activity]);
    setSelected(activity);
    setActiveNav("Today");
    showToast("Saved to Today");
  }, [replacementTarget, showToast]);
  const displaySingle = useCallback(activity => {
    projectToWindow([activity], 0);
  }, [projectToWindow]);
  const startBuilderWithActivity = useCallback(activity => {
    setBuilderDraft(draft => ({
      ...draft,
      editingRoutineId: draft.editingRoutineId,
      items: [...(draft.items || []), { ...activity, builderKey: "block-" + Date.now() + "-" + Math.random().toString(16).slice(2) }]
    }));
    showToast("Saved to Build. Open Build to review your routine.");
  }, [showToast]);
  const addActivityToRoutine = useCallback(activity => {
    startBuilderWithActivity(activity);
    setActiveNav("Routines");
  }, [startBuilderWithActivity]);
  const handleGradeChange = useCallback(grade => {
    const nextFilters = { ...filters, grade };
    setFilters(nextFilters);
    setTweak("grade", grade);
    setSelected(null);
    setSelectedVocabWord(null);
    setSelectedDoNowProblem(null);
    setDoNowAnswerVisible(false);
    const contentForGrade = buildContentActivities(grade, customVocab, customDoNow);
    setRoutine(pickRoutine(nextFilters, [...activityPool, ...customActivities, ...contentForGrade]));
    if (account?.uid) updateUserGrade(account.uid, grade).catch(() => {});
    showToast(`Grade set to ${grade}`);
  }, [account, activityPool, filters, customActivities, customVocab, customDoNow, setTweak, showToast]);

  const dismissWelcome = useCallback((grade) => {
    localStorage.setItem(`ofd:welcomed:${account?.uid}`, '1');
    setShowWelcome(false);
    if (grade) handleGradeChange(grade);
  }, [account.uid, handleGradeChange]);

  const projectWord = useCallback(() => {
    projectToWindow([vocabToActivity(vocabWord, currentGrade)], 0);
  }, [vocabWord, currentGrade, projectToWindow]);

  const projectDoNow = useCallback(() => {
    projectToWindow([doNowToActivity(doNowProblem, currentGrade, doNowSubject)], 0);
  }, [doNowProblem, currentGrade, doNowSubject, projectToWindow]);

  const addWordToRoutine = useCallback(() => {
    addActivityToRoutine(vocabToActivity(vocabWord, currentGrade));
  }, [vocabWord, currentGrade, addActivityToRoutine]);

  const addDoNowToRoutine = useCallback(() => {
    addActivityToRoutine(doNowToActivity(doNowProblem, currentGrade, doNowSubject));
  }, [doNowProblem, currentGrade, doNowSubject, addActivityToRoutine]);

  const loadOnThisDay = useCallback(async () => {
    setHistoryLoading(true);
    const fallback = getGradeHistoryItems(currentGrade, [], new Date());
    try {
      const res = await fetch("/api/on-this-day");
      if (!res.ok) throw new Error("History source unavailable");
      const data = await res.json();
      const liveEvents = Array.isArray(data.events) ? data.events : [];
      const events = getGradeHistoryItems(currentGrade, liveEvents, new Date());
      setHistoryItems(events);
      setSelectedHistoryItem(events[0]);
      const gradeBand = gradeToBand(currentGrade);
      setHistorySource(gradeBand === "K–2" || gradeBand === "3–5" ? "Elementary classroom fact bank" : (data.source || ON_THIS_DAY_SOURCE.name));
      setHistorySourceUrl(data.sourceUrl || onThisDayUrl());
    } catch {
      setHistoryItems(fallback);
      setSelectedHistoryItem(fallback[0]);
      setHistorySource(gradeToBand(currentGrade) === "K–2" || gradeToBand(currentGrade) === "3–5" ? "Elementary classroom fact bank" : "Built-in classroom fallback");
      setHistorySourceUrl(onThisDayUrl());
    } finally {
      setHistoryLoading(false);
    }
  }, [currentGrade]);

  useEffect(() => { loadOnThisDay(); }, [loadOnThisDay]);
  useEffect(() => {
    if (!routine.length) {
      if (selected) setSelected(null);
      return;
    }
    if (!selected || !routine.some(item => item.id === selected.id)) {
      setSelected(routine[0]);
    }
  }, [routine, selected]);

  const projectHistory = useCallback(() => {
    const item = selectedHistoryItem || historyItems[0];
    if (!item) return;
    projectToWindow([historyToActivity(item, historySourceUrl)], 0);
  }, [selectedHistoryItem, historyItems, historySourceUrl, projectToWindow]);

  const addHistoryToRoutine = useCallback(item => {
    if (!item) return;
    addActivityToRoutine(historyToActivity(item, historySourceUrl));
  }, [historySourceUrl, addActivityToRoutine]);

  const isMobile = () => window.innerWidth <= 900;

  const handleSelect = useCallback(act => {
    setSelected(act);
    if (isMobile()) setMobileDetailOpen(true);
  }, []);

  const handleSwap = useCallback(activity => {
    setReplacementTarget(activity);
    setActiveNav("Library");
    setMobileDetailOpen(false);
    showToast("Choose a replacement from Library");
  }, [showToast]);

  const cancelReplacement = useCallback(() => {
    setReplacementTarget(null);
    setActiveNav("Today");
  }, []);

  const handleRemoveFromToday = useCallback(activity => {
    const old = [...routine];
    setRoutine(r => r.filter(a => a.id !== activity.id));
    if (selected?.id === activity.id) setSelected(null);
    showToast("Removed from Today", () => setRoutine(old));
  }, [routine, selected, showToast]);

  const handleRandomize = useCallback(() => {
    const old = [...routine];
    setRoutine(pickRoutine(filters, allActivities));
    setSelected(null);
    showToast("New routine loaded", () => setRoutine(old));
  }, [routine, filters, allActivities, showToast]);

  const handleFave = useCallback(activity => {
    setFavorites(f => {
      const next = new Set(f);
      if (next.has(activity.id)) { next.delete(activity.id); showToast("Removed from Favorites"); }
      else { next.add(activity.id); showToast("Saved to Favorites"); }
      try { localStorage.setItem("ofd:favorites", JSON.stringify([...next])); } catch {}
      return next;
    });
  }, [showToast]);

  const handleApplyFilters = (f) => {
    setFilters(f);
    const contentForGrade = buildContentActivities(f.grade || currentGrade, customVocab, customDoNow);
    setRoutine(pickRoutine(f, [...POOL, ...customActivities, ...contentForGrade]));
    setSelected(null);
    showToast("Routine updated");
  };

  const saveCustomActivity = useCallback(activity => {
    const isNew = !customActivities.some(a => a.id === activity.id);
    if (isNew && isPlanFree && customActivities.length >= FREE_LIMITS.customActivities) {
      setUpgradeModalFor(`You've used your ${FREE_LIMITS.customActivities} free custom activity. Upgrade for unlimited.`);
      return;
    }
    setCustomActivities(items => {
      const exists = items.some(a => a.id === activity.id);
      const next = exists ? items.map(a => a.id === activity.id ? activity : a) : [...items, activity];
      persistCustomActivities(next);
      return next;
    });
    setRoutine(r => r.some(a => a.id === activity.id) ? r.map(a => a.id === activity.id ? activity : a) : [...r, activity]);
    setSelected(activity);
    setEditingActivity(null);
    setActiveNav(activeNav === "Routines" ? "Routines" : "Today");
    showToast(editingActivity ? "Saved: Activity updated" : "Saved: Activity created");
  }, [activeNav, customActivities, editingActivity, isPlanFree, showToast]);

  const deleteCustomActivity = useCallback(activity => {
    if (!confirm(`Delete "${activity.title}" from your activities?`)) return;
    const previousActivities = customActivities;
    const previousRoutine = routine;
    const previousFavorites = new Set(favorites);
    const previousSelected = selected;
    setCustomActivities(items => {
      const next = items.filter(a => a.id !== activity.id);
      persistCustomActivities(next);
      return next;
    });
    setRoutine(r => r.filter(a => a.id !== activity.id));
    setFavorites(f => {
      const next = new Set(f);
      next.delete(activity.id);
      try { localStorage.setItem("ofd:favorites", JSON.stringify([...next])); } catch {}
      return next;
    });
    if (selected?.id === activity.id) setSelected(null);
    showToast("Activity deleted", () => {
      setCustomActivities(previousActivities);
      persistCustomActivities(previousActivities);
      setRoutine(previousRoutine);
      setFavorites(previousFavorites);
      try { localStorage.setItem("ofd:favorites", JSON.stringify([...previousFavorites])); } catch {}
      setSelected(previousSelected);
    });
  }, [customActivities, favorites, routine, selected, showToast]);

  const saveBuiltRoutine = useCallback(({ name, items }) => {
    if (!builderDraft.editingRoutineId && isPlanFree && savedRoutines.length >= FREE_LIMITS.savedRoutines) {
      setUpgradeModalFor(`You've saved ${FREE_LIMITS.savedRoutines} routines — the free plan limit. Upgrade for unlimited.`);
      return;
    }
    if (builderDraft.editingRoutineId) {
      const updated = {
        id: builderDraft.editingRoutineId,
        name: name || "Custom Routine",
        savedAt: builderDraft.savedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items,
        source: "builder"
      };
      setSavedRoutines(list => {
        const next = list.map(r => r.id === builderDraft.editingRoutineId ? updated : r);
        persistSavedRoutines(next);
        return next;
      });
      setBuilderDraft(draft => ({ ...draft, name: updated.name, items: updated.items, savedAt: updated.savedAt }));
      showToast("Updated: Routine");
      return;
    }
    const saved = {
      id: `routine-${Date.now()}`,
      name: name || "Custom Routine",
      savedAt: new Date().toISOString(),
      items,
      source: "builder"
    };
    setSavedRoutines(list => {
      const next = [saved, ...list];
      persistSavedRoutines(next);
      return next;
    });
    showToast("Saved: Routine");
  }, [builderDraft.editingRoutineId, builderDraft.savedAt, isPlanFree, savedRoutines, showToast]);

  const useBuiltRoutineToday = useCallback(items => {
    setRoutine(items);
    setSelected(null);
    setActiveNav("Today");
    showToast("Routine loaded into Today");
  }, [showToast]);

  const projectBuiltRoutine = useCallback(items => {
    if (!items.length) return;
    projectToWindow(items, 0);
  }, [projectToWindow]);

  const saveCurrentRoutine = useCallback(() => {
    if (isPlanFree && savedRoutines.length >= FREE_LIMITS.savedRoutines) {
      setUpgradeModalFor(`You've saved ${FREE_LIMITS.savedRoutines} routines — the free plan limit. Upgrade for unlimited.`);
      return;
    }
    const saved = {
      id: `routine-${Date.now()}`,
      name: `${formatToday()} Routine`,
      savedAt: new Date().toISOString(),
      items: routine
    };
    setSavedRoutines(items => {
      const next = [saved, ...items];
      persistSavedRoutines(next);
      return next;
    });
    showToast("Saved: Routine");
  }, [isPlanFree, routine, savedRoutines, showToast]);

  const loadSavedRoutine = useCallback(saved => {
    setRoutine(saved.items);
    setSelected(null);
    setActiveNav("Today");
    showToast("Routine loaded");
  }, [showToast]);

  const editSavedRoutine = useCallback(saved => {
    setBuilderDraft({
      editingRoutineId: saved.id,
      name: saved.name,
      savedAt: saved.savedAt,
      items: (saved.items || []).map(item => ({ ...item, builderKey: "block-" + Date.now() + "-" + Math.random().toString(16).slice(2) }))
    });
    setActiveNav("Routines");
    showToast("Routine opened for editing");
  }, [showToast]);

  const projectSavedRoutine = useCallback(saved => {
    if (!saved.items?.length) return;
    projectToWindow(saved.items, 0);
  }, [projectToWindow]);

  const deleteSavedRoutine = useCallback(saved => {
    if (!confirm(`Delete "${saved.name}" from your saved routines?`)) return;
    const previous = savedRoutines;
    setSavedRoutines(items => {
      const next = items.filter(r => r.id !== saved.id);
      persistSavedRoutines(next);
      return next;
    });
    showToast("Routine deleted", () => {
      setSavedRoutines(previous);
      persistSavedRoutines(previous);
    });
  }, [savedRoutines, showToast]);

  const copyRoutine = useCallback(saved => {
    const text = saved.items.map((a,i) => `${i+1}. ${a.title} (${a.meta}) - ${a.prompt}`).join("\n");
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text);
    showToast("Routine copied");
  }, [showToast]);

  const saveWord = useCallback(word => {
    setCustomVocab(data => {
      const list = data[currentGrade] || [];
      const nextList = list.some(w => w.id === word.id) ? list.map(w => w.id === word.id ? word : w) : [...list, word];
      const next = { ...data, [currentGrade]: nextList };
      persistCustomVocab(next);
      return next;
    });
    setSelectedVocabWord(word);
    setEditingWord(null);
    showToast("Saved: Word");
  }, [currentGrade, showToast]);

  const deleteWord = useCallback(word => {
    if (!confirm(`Delete the word "${word.word}"?`)) return;
    const previous = customVocab;
    const previousSelected = selectedVocabWord;
    setCustomVocab(data => {
      const next = { ...data, [currentGrade]: (data[currentGrade] || []).filter(w => w.id !== word.id) };
      persistCustomVocab(next);
      return next;
    });
    if (selectedVocabWord?.id === word.id) setSelectedVocabWord(null);
    showToast("Word deleted", () => {
      setCustomVocab(previous);
      persistCustomVocab(previous);
      setSelectedVocabWord(previousSelected);
    });
  }, [currentGrade, customVocab, selectedVocabWord, showToast]);

  const saveDoNow = useCallback(problem => {
    setCustomDoNow(data => {
      const subjectData = data[doNowSubject] || {};
      const list = subjectData[currentGrade] || [];
      const nextList = list.some(p => p.id === problem.id) ? list.map(p => p.id === problem.id ? problem : p) : [...list, problem];
      const next = { ...data, [doNowSubject]: { ...subjectData, [currentGrade]: nextList } };
      persistCustomDoNow(next);
      return next;
    });
    setSelectedDoNowProblem(problem);
    setEditingDoNow(null);
    setDoNowAnswerVisible(false);
    showToast("Saved: Problem");
  }, [doNowSubject, currentGrade, showToast]);

  const deleteDoNow = useCallback(problem => {
    if (!confirm(`Delete "${problem.title}"?`)) return;
    const previous = customDoNow;
    const previousSelected = selectedDoNowProblem;
    setCustomDoNow(data => {
      const subjectData = data[doNowSubject] || {};
      const next = { ...data, [doNowSubject]: { ...subjectData, [currentGrade]: (subjectData[currentGrade] || []).filter(p => p.id !== problem.id) } };
      persistCustomDoNow(next);
      return next;
    });
    if (selectedDoNowProblem?.id === problem.id) setSelectedDoNowProblem(null);
    showToast("Problem deleted", () => {
      setCustomDoNow(previous);
      persistCustomDoNow(previous);
      setSelectedDoNowProblem(previousSelected);
    });
  }, [doNowSubject, currentGrade, customDoNow, selectedDoNowProblem, showToast]);

  const exportBackup = useCallback(() => {
    const backup = buildDataSnapshot();
    const text = JSON.stringify(backup, null, 2);
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `of-the-day-backup-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text);
    showToast("Backup downloaded");
  }, [buildDataSnapshot, showToast]);

  const importBackup = useCallback(text => {
    try {
      const data = JSON.parse(text);
      applyDataSnapshot(data);
      setSettingsOpen(false);
      showToast("Backup imported");
    } catch {
      showToast("Import failed");
    }
  }, [applyDataSnapshot, showToast]);

  const resetLocalData = useCallback(() => {
    if (!confirm("Reset custom data on this device? This keeps built-in content but removes local custom items, favorites, and saved routines.")) return;
    setFavorites(new Set());
    setCustomActivities([]);
    setSavedRoutines([]);
    setCustomVocab({});
    setCustomDoNow({});
    ["ofd:favorites","ofd:customActivities","ofd:savedRoutines","ofd:customVocab","ofd:customDoNow","ofd:projectorStyle"].forEach(k => localStorage.removeItem(k));
    const resetProjectorStyle = readProjectorStyle(account);
    setProjectorStyle(resetProjectorStyle);
    setSettingsOpen(false);
    showToast("Local data reset");
  }, [account, showToast]);

  const updateProjectorStyle = useCallback(next => {
    const normalized = normalizeProjectorStyle(next, account);
    setProjectorStyle(normalized);
    persistProjectorStyle(normalized);
  }, [account]);

  const navItems = [
    { icon:"☀️", label:"Today" },
    { icon:"⊞",  label:"Library" },
    { icon:"▦",  label:"Routines" },
    { icon:"🖼️", label:"Lesson Slides" },
  ];
  const mobileNavItems = navItems.concat({ icon:"⚙", label:"Settings", modal:true });
  const libraryViews = ["Library", "Word of the Day", "Do Now", "On This Day", "My Activities", "Favorites"];
  const buildViews = ["Routines", "My Routines", "My Activities"];
  const navActive = label => label === activeNav || (label === "Library" && libraryViews.includes(activeNav)) || (label === "Routines" && buildViews.includes(activeNav));

  const totalMin = Math.round(routine.reduce((s,a) => s + a.time, 0) / 60);
  const newCountToday = routine.filter(a => !seenActivities.has(a.id)).length;
  const addActivity = useCallback(() => {
    const cats = filters.cats && filters.cats.length ? filters.cats : DEFAULT_CATS;
    const used = new Set(routine.map(a => a.id));
    const cat = cats[routine.length % cats.length] || DEFAULT_CATS[0];
    let next = pickRandom(cat, null, filters, allActivities);
    if (next && used.has(next.id)) {
      next = allActivities.find(a => a.cat === cat && !used.has(a.id) && activityMatches(a, filters)) || next;
      if (!next && filters.grade) next = allActivities.find(a => a.cat === cat && !used.has(a.id) && activityMatchesGrade(a, filters.grade));
    }
    if (!next) return;
    setRoutine(r => [...r, next]);
    showToast("Saved to Today");
  }, [routine, filters, allActivities, showToast]);

  const sidebarGreeting = useMemo(() => {
    const name = displayName || tweaks.teacherName || '';
    const namePart = name ? `, ${name}` : '';
    if (streakCount >= 30) return `🎉 Day ${streakCount} in a row${namePart}!`;
    if (streakCount >= 14) return `💪 Day ${streakCount} in a row${namePart}!`;
    if (streakCount >= 7) return `🏆 Day ${streakCount} in a row${namePart}!`;
    if (streakCount >= 3) return `🔥 Day ${streakCount} in a row${namePart}`;
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return `Good morning${namePart}`;
    if (h >= 12 && h < 17) return `Good afternoon${namePart}`;
    return `Good evening${namePart}`;
  }, [displayName, tweaks.teacherName, streakCount]);

  return (
    <div className="app" style={{ "--home-accent": projectorStyle.homeAccent, "--home-soft": projectorStyle.homeSoft }}>
      {!account?.uid && (
        <div className="demo-banner" role="banner">
          <span>
            You're previewing OfTheDay — changes won't be saved.{' '}
            <a href="/login?signup=1" className="demo-banner-cta">Create your free account →</a>
          </span>
        </div>
      )}
      {showProBanner && (
        <div className="pro-success-banner" role="status">
          Welcome to Pro! 🌅
          <button className="pro-success-banner-close" type="button" onClick={() => setShowProBanner(false)} aria-label="Dismiss">✕</button>
        </div>
      )}
      {showTrialBanner && (
        <div className={`trial-banner${trialDaysLeft <= 3 ? ' trial-banner--urgent' : trialDaysLeft <= 7 ? ' trial-banner--warning' : ''}`} role="status">
          <span>
            {trialDaysLeft === 0
              ? '⏰ Your free trial has ended — '
              : `⭐ ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left in your free trial — `}
            <a href="/upgrade" className="trial-banner-link">Upgrade to Pro</a>
          </span>
          <button className="trial-banner-close" type="button" onClick={dismissTrialBanner} aria-label="Dismiss">✕</button>
        </div>
      )}
      {!verifyBannerDismissed && showVerifyBanner && (
        <div className="verify-banner" role="status">
          <span>
            Please verify your email address ({account.email}).{' '}
            {verifySent
              ? 'Verification email sent!'
              : <button type="button" className="verify-banner-resend" onClick={resendVerification}>Resend verification email</button>}
          </span>
          <button className="trial-banner-close" type="button" onClick={dismissVerifyBanner} aria-label="Dismiss">✕</button>
        </div>
      )}
      {/* ── APP SHELL (sidebar + main) ── */}
      <div className="app-shell">
      {/* ── SIDEBAR ── */}
      <div className={`sidebar${sidebarCollapsed ? ' sidebar--collapsed' : ''}`}>
        <div className="sidebar-logo">
          {sidebarCollapsed
            ? <span className="sidebar-logo-mark">☀️</span>
            : <img className="sidebar-logo-img" src={LOGO_SRC} alt="Of The Day logo"/>
          }
          {!sidebarCollapsed && <div className="logo-sub">{sidebarGreeting}</div>}
        </div>
        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={() => {
            const next = !sidebarCollapsed;
            setSidebarCollapsed(next);
            try { localStorage.setItem('ofd:sidebarCollapsed', next ? '1' : '0'); } catch {}
          }}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? '›' : '‹'}
        </button>
        <nav className="nav">
          {navItems.map(n => (
            <React.Fragment key={n.label}>
              <button type="button" className={`nav-item${navActive(n.label)?' active':''}`} onClick={() => setActiveNav(n.label)} title={sidebarCollapsed ? n.label : undefined}>
                <span className="nav-icon">{n.icon}</span>
                {!sidebarCollapsed && <span>{n.label}</span>}
              </button>
              {n.label === "Routines" && (
                <button type="button" className="nav-item nav-item-sub" onClick={() => setSettingsOpen(true)} title={sidebarCollapsed ? 'Settings' : undefined}>
                  <span className="nav-icon">⚙</span>
                  {!sidebarCollapsed && <span>Settings</span>}
                </button>
              )}
            </React.Fragment>
          ))}
        </nav>
        {!sidebarCollapsed && streakCount >= 2 && (
          <div className="sidebar-streak">
            <span className="sidebar-streak-flame">🔥</span>
            <span className="sidebar-streak-label">{streakCount}-day streak</span>
            {streakCount === 7 && <span className="sidebar-streak-badge">One week!</span>}
            {streakCount === 14 && <span className="sidebar-streak-badge">Two weeks!</span>}
            {streakCount === 30 && <span className="sidebar-streak-badge">One month!</span>}
          </div>
        )}
        {sidebarCollapsed && streakCount >= 2 && (
          <div className="sidebar-streak sidebar-streak--collapsed" title={`${streakCount}-day streak`}>🔥</div>
        )}
        {!sidebarCollapsed && vocabWord && (
          <button type="button" className="sidebar-otd-teaser" onClick={() => setActiveNav("Word of the Day")}>
            <span className="sidebar-otd-icon">📖</span>
            <span className="sidebar-otd-text">
              <span className="sidebar-otd-label">Word of the day · <span className="sidebar-otd-reset">{midnightResetLabel}</span></span>
              <span className="sidebar-otd-fact"><strong>{vocabWord.word}</strong> — {vocabWord.meaning}</span>
            </span>
          </button>
        )}
        {!sidebarCollapsed && historyItems[0] && (
          <button type="button" className="sidebar-otd-teaser" onClick={() => setActiveNav("On This Day")}>
            <span className="sidebar-otd-icon">⏳</span>
            <span className="sidebar-otd-text">
              <span className="sidebar-otd-label">On this day · <span className="sidebar-otd-reset">{midnightResetLabel}</span></span>
              <span className="sidebar-otd-fact">{historyItems[0].year}: {historyItems[0].title}</span>
            </span>
          </button>
        )}
        <div className="sidebar-actions">
          {!sidebarCollapsed && account?.tier !== 'pro' && (
            trialDaysLeft !== null ? (
              <div className="sidebar-trial-card">
                <div className="sidebar-trial-days">
                  {trialDaysLeft === 0 ? 'Trial ended' : `${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} left in trial`}
                </div>
                <a href="/upgrade" className="sidebar-trial-upgrade">Upgrade to Pro →</a>
              </div>
            ) : (
              <a href="/upgrade" className="sidebar-upgrade-btn">⭐ Go Pro</a>
            )
          )}
          {!sidebarCollapsed && projectorConnected && (
            <div className="projector-live-card">
              <strong>Projector live</strong>
              Student view is open in a separate window.
              <button type="button" onClick={stopProjector}>Stop Projecting</button>
            </div>
          )}
          <button className="sidebar-profile" type="button" onClick={() => setProfileOpen(true)} title={sidebarCollapsed ? (displayName || account?.name || 'Profile') : undefined}>
            <div className="sidebar-avatar">{(displayName || account?.name || account?.email || '?')[0].toUpperCase()}</div>
            {!sidebarCollapsed && (
              <div className="sidebar-profile-info">
                <div className="sidebar-profile-name">{displayName || account?.name || 'Teacher'}</div>
                <div className="sidebar-profile-plan">
                  {account?.tier === 'pro' ? 'Pro' : trialDaysLeft !== null ? 'Trial' : 'Free'} · Profile
                </div>
              </div>
            )}
            {!sidebarCollapsed && <span className="sidebar-profile-chevron">›</span>}
          </button>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div className="main">

        {/* TOP BAR */}
        {activeNav === "Today" && (
          <div className="topbar">
            <div className="topbar-left">
              <div className="topbar-title">Today’s Meeting</div>
              <div className="topbar-date">{todayLabel} · {currentGrade} · Greeting, Sharing, Activity, Message · ~{totalMin} min{streakCount >= 2 && <span className="topbar-streak-pill">🔥 {streakCount}-day streak</span>}</div>
            </div>
            <div className="topbar-right grade-control-wrap">
              <GradePicker value={currentGrade} onChange={handleGradeChange}/>
              <Chip label={`${filters.time || tweaks.time} · ${filters.energy || tweaks.energy}`} onClick={() => setFilterOpen(true)}/>
              <Chip label="Adjust" onClick={() => setFilterOpen(true)}/>
            </div>
          </div>
        )}
        {activeNav === "Library" && (
          <div className="topbar">
            <div className="topbar-left">
              <div className="topbar-title">Library</div>
              <div className="topbar-date">All ready activities, Do Nows, words, history, writing prompts, favorites, and your own ideas</div>
            </div>
            <div className="topbar-right grade-control-wrap"><GradePicker value={currentGrade} onChange={handleGradeChange}/></div>
          </div>
        )}
        {activeNav === "Favorites" && (
          <div className="topbar">
            <div className="topbar-left">
              <div className="topbar-title">Favorites</div>
              <div className="topbar-date">{favorites.size} saved</div>
            </div>
            <div className="topbar-right grade-control-wrap"><GradePicker value={currentGrade} onChange={handleGradeChange}/></div>
          </div>
        )}
        {activeNav === "This Week" && (
          <div className="topbar">
            <div className="topbar-left">
              <div className="topbar-title">This Week</div>
              <div className="topbar-date">{usedThisWeek.size} {usedThisWeek.size === 1 ? "activity" : "activities"} used · resets Monday</div>
            </div>
            <div className="topbar-right grade-control-wrap"><GradePicker value={currentGrade} onChange={handleGradeChange}/></div>
          </div>
        )}
        {activeNav === "Routines" && (
          <div className="topbar">
            <div className="topbar-left">
              <div className="topbar-title">Routines</div>
              <div className="topbar-date">Create activities · edit your items · build routines · {savedRoutines.length} saved</div>
            </div>
            <div className="topbar-right grade-control-wrap"><GradePicker value={currentGrade} onChange={handleGradeChange}/></div>
          </div>
        )}
        {activeNav === "Lesson Slides" && (
          <div className="topbar">
            <div className="topbar-left">
              <div className="topbar-title">Lesson Slides</div>
              <div className="topbar-date">AI-generated classroom display slides · learning targets, success criteria, vocabulary</div>
            </div>
            {isPlanFree && (
              <div className="topbar-right">
                <a href="/upgrade" className="btn-primary btn-compact" style={{ textDecoration: 'none' }}>⭐ Upgrade for unlimited</a>
              </div>
            )}
          </div>
        )}
        {activeNav === "Word of the Day" && (
          <div className="topbar">
            <div className="topbar-left">
              <div className="topbar-title">Word of the Day</div>
              <div className="topbar-date">Vocabulary · {currentGrade} · {vocabWord.word}</div>
            </div>
            <div className="topbar-right grade-control-wrap"><GradePicker value={currentGrade} onChange={handleGradeChange}/></div>
          </div>
        )}
        {activeNav === "Do Now" && (
          <div className="topbar">
            <div className="topbar-left">
              <div className="topbar-title">Do Now</div>
              <div className="topbar-date">{(DO_NOW_SECTIONS[doNowSubject] || DO_NOW_SECTIONS.math).label} · {currentGrade}</div>
            </div>
            <div className="topbar-right grade-control-wrap"><GradePicker value={currentGrade} onChange={handleGradeChange}/></div>
          </div>
        )}
        {activeNav === "On This Day" && (
          <div className="topbar">
            <div className="topbar-left">
              <div className="topbar-title">On This Day</div>
              <div className="topbar-date">Daily history · {historySource}</div>
            </div>
            <div className="topbar-right grade-control-wrap"><GradePicker value={currentGrade} onChange={handleGradeChange}/></div>
          </div>
        )}
        {activeNav === "My Activities" && (
          <div className="topbar">
            <div className="topbar-left">
              <div className="topbar-title">My Activities</div>
              <div className="topbar-date">{customActivities.length} custom</div>
            </div>
            <div className="topbar-right grade-control-wrap"><GradePicker value={currentGrade} onChange={handleGradeChange}/></div>
          </div>
        )}
        {activeNav === "Routines" && (
          <div className="topbar">
            <div className="topbar-left">
              <div className="topbar-title">Routines</div>
              <div className="topbar-date">{savedRoutines.length} saved</div>
            </div>
            <div className="topbar-right grade-control-wrap"><GradePicker value={currentGrade} onChange={handleGradeChange}/></div>
          </div>
        )}

        {/* BODY */}
        <div className="body">

          {/* TODAY */}
          {activeNav === "Today" && (
            <>
              <div className="routine-col">
                {showWelcome && (
                <div className="welcome-card">
                  <button className="welcome-dismiss" type="button" aria-label="Dismiss" onClick={() => dismissWelcome(null)}>✕</button>
                  <div className="welcome-heading">Welcome to OfTheDay 👋</div>
                  <div className="welcome-sub">Your morning meeting is already built. Three steps to get started:</div>
                  <div className="welcome-steps">
                    <div className="welcome-step">
                      <div className="welcome-step-num">1</div>
                      <div className="welcome-step-body">
                        <strong>Choose your grade</strong>
                        <span>Activities, vocabulary, and warm-ups adjust automatically.</span>
                      </div>
                    </div>
                    <div className="welcome-step">
                      <div className="welcome-step-num">2</div>
                      <div className="welcome-step-body">
                        <strong>See today's routine</strong>
                        <span>A complete Greeting, Sharing, Activity, and Morning Message — ready now.</span>
                      </div>
                    </div>
                    <div className="welcome-step">
                      <div className="welcome-step-num">3</div>
                      <div className="welcome-step-body">
                        <strong>Project for your class</strong>
                        <span>Hit "Project Today" to display the routine full-screen on your smartboard.</span>
                      </div>
                    </div>
                  </div>
                  <div className="welcome-grade-row">
                    <span className="welcome-grade-label">Pick your grade to get started:</span>
                    {["K–2","3–5","6–8","9–12"].map(g => (
                      <button
                        key={g} type="button"
                        className={`welcome-grade-chip${currentGrade === g ? ' active' : ''}`}
                        onClick={() => dismissWelcome(g)}
                      >{g}</button>
                    ))}
                  </div>
                </div>
              )}
              {projectedToday && (
                <div className="completion-card">
                  <span className="completion-icon">✓</span>
                  <span className="completion-msg">
                    Morning meeting complete{streakCount >= 2 ? ` · ${streakCount}-day streak 🔥` : ''} — see you tomorrow!
                  </span>
                  {isFriday && <span className="completion-friday">Have a great weekend — Monday's routine is ready. 🌅</span>}
                </div>
              )}
              {!projectedToday && isFriday && (
                <div className="friday-card">
                  🌅 Have a great weekend! Come back Monday — your next routine will be ready.
                </div>
              )}
              <div className="routine-header">
                  <div className="routine-header-row">
                    <div>
                      <div className="section-eyebrow">Responsive Classroom Meeting</div>
                      <div className="routine-ready">Ready · {routine.length} components · ~{totalMin} min{newCountToday > 0 && <span className="routine-new-count"> · {newCountToday} new to you</span>}</div>
                    </div>
                    <button className="btn-secondary btn-compact teacher-filter-button" type="button" onClick={() => setFilterOpen(true)}>Filters</button>
                  </div>
                  <div className="morning-hero">
                    <div>
                      <div className="morning-hero-title">
                        {projectedYesterday && !projectedToday
                          ? "Welcome back! New activities are waiting."
                          : projectorStyle.className && projectorStyle.className !== (account?.name ? account.name + "'s Class" : "Our Class")
                            ? `${projectorStyle.className}'s morning meeting is ready.`
                            : "Your daily classroom ritual is ready."}
                      </div>
                      <div className="morning-hero-text">
                        {projectedYesterday && !projectedToday
                          ? `Today's routine is built and ready for ${projectorStyle.className || 'your class'}. Your ${streakCount}-day streak is on the line — let's keep it going.`
                          : "A complete classroom meeting built around greeting, sharing, group activity, and morning message so students start connected and ready to learn."}
                      </div>
                    </div>
                    <div className="morning-hero-actions">
                      <button className="btn-primary btn-compact" type="button" onClick={() => projectToWindow(routine, 0)}>Project Today</button>
                      <button className="btn-secondary btn-compact" type="button" onClick={handleRandomize}>Shuffle</button>
                    </div>
                  </div>
                  <div className="component-rail" aria-label="Meeting components">
                    {DEFAULT_CATS.map((cat, i) => {
                      const cm = CAT_META[cat] || {};
                      return <div key={cat} className="component-pill" style={{ borderTop: `3px solid ${cm.color || "#DDD"}` }}>
                        <div className="component-pill-step">Step {i + 1}</div>
                        <div className="component-pill-name">{cm.emoji} {cat}</div>
                      </div>;
                    })}
                  </div>
                </div>
                <div className="cards-scroll">
                  {routine.map((a, index) => (
                    <ActivityCard key={a.id} activity={a} index={index}
                      selected={selected?.id === a.id}
                      onSelect={handleSelect}
                      onSwap={handleSwap}
                      onFave={handleFave}
                      favorites={favorites}
                      seenActivities={seenActivities}
                      useNow={true}
                    />
                  ))}
                  <button className="add-more add-more-quiet" type="button" onClick={() => setActiveNav("Library")}>+ Choose from Library</button>
                </div>
                <div className="action-bar today-save-bar">
                  <button className="btn-secondary" type="button" disabled={!routine.length} onClick={saveCurrentRoutine}>Save for later</button>
                </div>
              </div>
              <DetailPanel
                activity={selected}
                onSwap={handleSwap}
                onDisplayOne={a => projectToWindow(routine, Math.max(0, routine.findIndex(x=>x.id===a.id)))}
                onAddToRoutine={addActivityToRoutine}
                onRemove={handleRemoveFromToday}
                onFave={handleFave}
                favorites={favorites}
                currentGrade={currentGrade}
              />
            </>
          )}

          {/* BROWSE */}
          {activeNav === "Library" && (
            <BrowseScreen
              activities={libraryActivities}
              grade={currentGrade}
              favorites={favorites}
              usedToday={usedToday}
              builderCount={(builderDraft.items || []).length}
              replacementTarget={replacementTarget}
              onCancelReplacement={cancelReplacement}
              onFave={handleFave}
              onCreate={() => { setEditingActivity(null); setCustomOpen(true); }}
              onAdd={addToToday}
              onBuild={startBuilderWithActivity}
              onDisplay={displaySingle}
              onReviewRoutine={() => setActiveNav("Routines")}
              onOpenTool={setActiveNav}
              userTier={userTier}
              onUpgradeNeeded={() => setUpgradeModalFor("Upgrade to Pro to unlock all activities.")}
            />
          )}

          {/* FAVORITES */}
          {activeNav === "Favorites" && (
            <FavoritesScreen
              activities={libraryActivities}
              favorites={favorites}
              onFave={handleFave}
              onAdd={addToToday}
              onBuild={startBuilderWithActivity}
              onDisplay={displaySingle}
            />
          )}

          {/* THIS WEEK */}
          {activeNav === "This Week" && (
            <ThisWeekScreen
              activities={libraryActivities}
              usedThisWeek={usedThisWeek}
              onAdd={addToToday}
              onBuild={startBuilderWithActivity}
              onDisplay={displaySingle}
            />
          )}

          {/* ROUTINES */}
          {activeNav === "Routines" && (
            <BuildScreen
              customActivities={customActivities}
              onCreateActivity={() => { setEditingActivity(null); setCustomOpen(true); }}
              onEditActivity={a => { setEditingActivity(a); setCustomOpen(true); }}
              onDeleteActivity={deleteCustomActivity}
              onAddActivityToday={a => { setRoutine(r => [...r, a]); setActiveNav("Today"); showToast("Saved to Today"); }}
              onBuildActivity={addActivityToRoutine}
              routineProps={{
                draft: builderDraft,
                routines: savedRoutines,
                onDraftChange: setBuilderDraft,
                onSaveRoutine: saveBuiltRoutine,
                onLoadToday: useBuiltRoutineToday,
                onProject: projectBuiltRoutine,
                onOpenLibrary: () => setActiveNav("Library"),
                onLoadSaved: loadSavedRoutine,
                onEditSaved: editSavedRoutine,
                onProjectSaved: projectSavedRoutine,
                onDeleteSaved: deleteSavedRoutine,
                onCopySaved: copyRoutine
              }}
            />
          )}

          {/* WORD OF THE DAY */}
          {activeNav === "Word of the Day" && (
            <VocabularyScreen
              grade={currentGrade}
              word={vocabWord}
              words={vocabWords}
              onChoose={setSelectedVocabWord}
              onCreate={() => { setEditingWord(null); setWordEditorOpen(true); }}
              onEdit={word => { setEditingWord(word); setWordEditorOpen(true); }}
              onDelete={deleteWord}
              onRefresh={() => { setSelectedVocabWord(null); setVocabOffset(o => o + 1); }}
              onProject={projectWord}
              onAddToRoutine={addWordToRoutine}
            />
          )}

          {/* DO NOW */}
          {activeNav === "Do Now" && (
            <DoNowScreen
              grade={currentGrade}
              subject={doNowSubject}
              problem={doNowProblem}
              problems={doNowProblems}
              revealAnswer={doNowAnswerVisible}
              onReveal={() => setDoNowAnswerVisible(true)}
              onChoose={problem => { setSelectedDoNowProblem(problem); setDoNowAnswerVisible(false); }}
              onCreate={() => { setEditingDoNow(null); setDoNowEditorOpen(true); }}
              onEdit={problem => { setEditingDoNow(problem); setDoNowEditorOpen(true); }}
              onDelete={deleteDoNow}
              onRefresh={() => { setSelectedDoNowProblem(null); setDoNowOffset(o => o + 1); setDoNowAnswerVisible(false); }}
              onSubjectChange={subject => { setDoNowSubject(subject); setSelectedDoNowProblem(null); setDoNowAnswerVisible(false); }}
              onProject={projectDoNow}
              onAddToRoutine={addDoNowToRoutine}
            />
          )}

          {/* ON THIS DAY */}
          {activeNav === "On This Day" && (
            <OnThisDayScreen
              dateLabel={todayLabel}
              items={historyItems}
              selectedItem={selectedHistoryItem}
              loading={historyLoading}
              source={historySource}
              sourceUrl={historySourceUrl}
              onChoose={setSelectedHistoryItem}
              onRefresh={loadOnThisDay}
              onProject={projectHistory}
              onAddToRoutine={addHistoryToRoutine}
            />
          )}

          {/* MY ACTIVITIES */}
          {activeNav === "My Activities" && (
            <MyActivitiesScreen
              customActivities={customActivities}
              onCreate={() => { setEditingActivity(null); setCustomOpen(true); }}
              onEdit={a => { setEditingActivity(a); setCustomOpen(true); }}
              onDelete={deleteCustomActivity}
              onAdd={addToToday}
              onBuild={addActivityToRoutine}
            />
          )}

          {/* SAVED ROUTINES */}
          {activeNav === "Routines" && (
            <SavedRoutinesScreen
              routines={savedRoutines}
              onLoad={loadSavedRoutine}
              onEdit={editSavedRoutine}
              onProject={projectSavedRoutine}
              onDelete={deleteSavedRoutine}
              onCopy={copyRoutine}
            />
          )}

          {/* LESSON SLIDES */}
          {activeNav === "Lesson Slides" && (
            <LessonSlideCreator
              account={account}
              isPlanFree={isPlanFree}
              onUpgradeNeeded={() => account?.uid ? setUpgradeModalFor("Upgrade to Pro to create, save, and project unlimited lesson slides.") : (window.location.href = '/login?signup=1')}
              onProjectSlide={projectSlideToWindow}
              savedBehavioralExpectations={savedBehavioralExpectations}
              onSaveBehavioralExpectations={exps => {
                setSavedBehavioralExpectations(exps);
                if (account?.uid) saveBehavioralExpectations(account.uid, exps).catch(() => {});
              }}
            />
          )}

        </div>

        {/* MOBILE BOTTOM NAV */}
        <div className="mobile-nav">
          <div className="mobile-nav-items">
            {mobileNavItems.map(n => (
              <button key={n.label} type="button" className={`mobile-nav-item${navActive(n.label)?' active':''}`} onClick={() => n.modal ? setSettingsOpen(true) : setActiveNav(n.label)}>
                <div className="mobile-nav-icon">{n.icon}</div>
                <div className="mobile-nav-label" style={{color: navActive(n.label) ? "var(--teal)" : "var(--muted)"}}>{n.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
      </div>{/* end app-shell */}

      {/* MOBILE DETAIL SHEET */}
      {mobileDetailOpen && selected && (
        <div className="mobile-detail-overlay" onClick={e => e.target === e.currentTarget && setMobileDetailOpen(false)}>
          <div className="mobile-detail-sheet">
            <div className="sheet-handle" style={{marginBottom:0}}/>
            <DetailContent
              activity={selected}
              onSwap={a => { handleSwap(a); setMobileDetailOpen(false); }}
              onDisplayOne={a => { setMobileDetailOpen(false); projectToWindow(routine, Math.max(0, routine.findIndex(x=>x.id===a.id))); }}
              onAddToRoutine={a => { setMobileDetailOpen(false); addActivityToRoutine(a); }}
              onRemove={a => { setMobileDetailOpen(false); handleRemoveFromToday(a); }}
              onFave={a => { handleFave(a); }}
              isFavorite={favorites.has(selected.id)}
              currentGrade={currentGrade}
            />
          </div>
        </div>
      )}

      {/* FILTER SHEET */}
      {filterOpen && (
        <FilterSheet filters={filters} onApply={handleApplyFilters} onClose={() => setFilterOpen(false)}/>
      )}

      {/* SETTINGS SHEET */}
      {settingsOpen && (
        <SettingsSheet
          onClose={() => setSettingsOpen(false)}
          onExport={exportBackup}
          onImport={importBackup}
          onReset={resetLocalData}
          projectorStyle={projectorStyle}
          onProjectorStyleChange={updateProjectorStyle}
          onCloudSave={saveToCloud}
          onCloudRestore={restoreFromCloud}
          cloudStatus={cloudStatus}
          cloudBusy={cloudBusy}
          cloudAutoSave={cloudAutoSave}
          onCloudAutoSaveChange={setCloudAutoSave}
        />
      )}

      {/* PROFILE SHEET */}
      {profileOpen && (
        <ProfileSheet
          account={account}
          displayName={displayName}
          trialDaysLeft={trialDaysLeft}
          effectivePlan={effectivePlan}
          onClose={() => setProfileOpen(false)}
          onSignOut={onSignOut}
          onSave={({ name, grade }) => {
            setDisplayName(name);
            handleGradeChange(grade);
          }}
        />
      )}

      {presentationChoice && (
        <PresentationChoiceModal
          defaultView={presentationViewDefault}
          onChoose={choosePresentationView}
          onClose={() => setPresentationChoice(null)}
        />
      )}

      {/* CUSTOM ACTIVITY SHEET */}
      {customOpen && (
        <CustomActivitySheet initialActivity={editingActivity} onSave={saveCustomActivity} onClose={() => { setCustomOpen(false); setEditingActivity(null); }}/>
      )}

      {/* WORD EDITOR */}
      {wordEditorOpen && (
        <WordEditorSheet grade={currentGrade} initialWord={editingWord} onSave={saveWord} onClose={() => { setWordEditorOpen(false); setEditingWord(null); }}/>
      )}

      {/* DO NOW EDITOR */}
      {doNowEditorOpen && (
        <DoNowEditorSheet grade={currentGrade} subject={doNowSubject} initialProblem={editingDoNow} onSave={saveDoNow} onClose={() => { setDoNowEditorOpen(false); setEditingDoNow(null); }}/>
      )}

      {/* STUDENT DISPLAY */}
      {displayMode && (
        <DisplayMode routine={displayMode.routine || routine} startIndex={displayMode.startIndex} projectorStyle={projectorStyle} initialView={presentationViewDefault} onExit={() => {
          const today = new Date().toISOString().slice(0, 10);
          try { localStorage.setItem('ofd:projectedToday', today); } catch {}
          setProjectedToday(true);
          const ids = (displayMode.routine || routine).map(a => a.id);
          markActivitiesSeen(ids);
          setSeenActivities(readSeenActivities());
          setDisplayMode(null);
        }}/>
      )}

      {/* TOASTS */}
      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className="toast" role="status" aria-live="polite">
            <span className="toast-icon" aria-hidden="true">✓</span>
            <span className="toast-message">{t.msg}</span>
            {t.undoFn && <span className="toast-undo" onClick={t.undoFn}>Undo</span>}
          </div>
        ))}
      </div>

      {upgradeModalFor && <UpgradeModal feature={upgradeModalFor} onClose={() => setUpgradeModalFor(null)} />}

      {/* TWEAKS */}
      <TweaksPanel>
        <TweakSection label="Teacher">
          <TweakText id="teacherName" label="Name" value={tweaks.teacherName} onChange={v=>setTweak("teacherName",v)}/>
        </TweakSection>
        <TweakSection label="Defaults">
          <TweakSelect id="grade" label="Grade Band" value={tweaks.grade} options={["K–2","3–5","6–8","9–12"]} onChange={v=>setTweak("grade",v)}/>
          <TweakSelect id="time" label="Time" value={tweaks.time} options={["5 min","10 min","15 min","20+ min"]} onChange={v=>setTweak("time",v)}/>
          <TweakSelect id="energy" label="Energy" value={tweaks.energy} options={["Calm","Medium","Active"]} onChange={v=>setTweak("energy",v)}/>
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

function UpgradePage({ account }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const monthlyPriceId = import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID;
  const annualPriceId = import.meta.env.VITE_STRIPE_ANNUAL_PRICE_ID;

  const checkout = async (priceId) => {
    if (!priceId) {
      setError('Checkout is not configured yet. Please contact hello@oftheday.net.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const fn = httpsCallable(functions, 'createCheckoutSession');
      const { data } = await fn({ priceId, userId: account.uid });
      window.location.href = data.url;
    } catch {
      setError('Something went wrong. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div className="upgrade-page">
      <div className="upgrade-page-inner">
        <img src={LOGO_SRC} alt="Of The Day" className="upgrade-page-logo" />
        <h1 className="upgrade-page-title">Upgrade to Pro</h1>
        <p className="upgrade-page-sub">Unlock all activities, unlimited saved routines, and custom activities.</p>
        <div className="upgrade-pricing-cards">
          <div className="upgrade-pricing-card">
            <div className="upgrade-pricing-label">Monthly</div>
            <div className="upgrade-pricing-amount">$9<span className="upgrade-pricing-period">/mo</span></div>
            <button className="btn-primary" type="button" disabled={busy} onClick={() => checkout(monthlyPriceId)}>
              {busy ? 'Loading…' : 'Get Pro Monthly'}
            </button>
          </div>
          <div className="upgrade-pricing-card upgrade-pricing-card--featured">
            <div className="upgrade-pricing-badge">Best value</div>
            <div className="upgrade-pricing-label">Annual</div>
            <div className="upgrade-pricing-amount">$79<span className="upgrade-pricing-period">/yr</span></div>
            <div className="upgrade-pricing-note">Save $29 vs monthly</div>
            <button className="btn-primary" type="button" disabled={busy} onClick={() => checkout(annualPriceId)}>
              {busy ? 'Loading…' : 'Get Pro Annual'}
            </button>
          </div>
        </div>
        {error && <p className="upgrade-page-error">{error}</p>}
        <Link to="/dashboard" className="upgrade-page-back">← Back to app</Link>
      </div>
    </div>
  );
}

function App() {
  const isProjectorWindow = new URLSearchParams(window.location.search).get("projector") === "1";
  const isSlideProjectorWindow = new URLSearchParams(window.location.search).get("slideProjector") === "1";
  const [authState, setAuthState] = useState({ loading: true, account: null });

  useEffect(() => {
    if (isProjectorWindow || isSlideProjectorWindow) {
      setAuthState({ loading: false, account: null });
      return;
    }
    getRedirectResult(auth).catch(err => {
      console.error("Google redirect result failed", err);
      const code = err?.code || "";
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        setAuthState(s => ({ ...s, loading: false, googleError: err }));
      }
    });
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthState({ loading: false, account: null });
        return;
      }
      try {
        let userDoc = await getUserDocument(user.uid);
        if (!userDoc) {
          // New Google user — Cloud Function may not have run yet
          await createUserDocument(user.uid, {
            name: user.displayName || "",
            email: user.email || "",
            grade: "3",
          });
          userDoc = await getUserDocument(user.uid);
        }
        const account = {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          name: userDoc?.name || user.displayName || "",
          grade: userDoc?.grade || "3",
          plan: userDoc?.plan || "trial",
          trialStartedAt: tsToMs(userDoc?.trialStartedAt),
          tier: userDoc?.tier || null,
          behavioralExpectations: userDoc?.behavioralExpectations || [],
        };
        await migrateFromLocalStorage(user.uid);
        setAuthState({ loading: false, account });
      } catch {
        setAuthState({ loading: false, account: null });
      }
    });
    return unsubscribe;
  }, [isProjectorWindow, isSlideProjectorWindow]);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setAuthState({ loading: false, account: null });
  }, []);

  if (isProjectorWindow) return <ProjectorReceiver />;
  if (isSlideProjectorWindow) return <LessonSlideReceiver />;

  const loading = <div className="auth-loading">Loading…</div>;
  const authed = authState.account;
  const DEMO_ACCOUNT = { uid: null, name: 'Guest Teacher', email: '', grade: '3–5', plan: 'free', tier: 'free', emailVerified: true };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          !authState.loading && authed
            ? <Navigate to="/dashboard" replace />
            : <LandingPage />
        } />
        <Route path="/login" element={
          authState.loading ? loading :
          authed ? <Navigate to="/dashboard" replace /> :
          <AuthScreen onAuthed={account => setAuthState({ loading: false, account })} googleError={authState.googleError} />
        } />
        <Route path="/dashboard" element={
          authState.loading ? loading :
          authed ? <MainApp account={authed} onSignOut={signOut} /> :
          <Navigate to="/login" replace />
        } />
        <Route path="/demo" element={<MainApp account={DEMO_ACCOUNT} onSignOut={() => window.location.href = '/'} />} />
        <Route path="/upgrade" element={
          authState.loading ? loading :
          authed ? <UpgradePage account={authed} /> :
          <Navigate to="/login" replace />
        } />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/district" element={<DistrictPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
