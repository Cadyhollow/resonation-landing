'use strict';

/*
 * The Learning Center's markup, in two states: the sign-in card and the unlocked
 * page. Both are rendered on the server by api/learn.js — the unlocked markup is
 * never sent to a browser that has not signed in, so it cannot be read out of
 * "view source" the way a client-side gate can.
 *
 * The CSS and layout below are the design source of truth, copied verbatim from
 * resonation-learning-center.html. Edit the constants at the top of this file;
 * leave the markup alone unless the design itself changes.
 *
 * This file lives in /api on purpose. Vercel never serves the contents of /api as
 * a static file, so there is no URL that hands out this page unguarded. The
 * underscore prefix keeps Vercel from turning it into an endpoint of its own; the
 * 404 handler exported at the bottom is a belt-and-braces second line of defence.
 */

/* ── Support details ──────────────────────────────────────────────────────────
   These appear in three places between them (the top bar, the "Stuck? We've got
   you" card, and the footer). They are constants so all three stay in step. */

// TODO(phone): replace with the real ResoNation support number. Both lines must
// change together — PHONE_DISPLAY is what a client reads, PHONE_TEL is what their
// phone dials (E.164: a leading + and country code, digits only).
const PHONE_DISPLAY = '(555) 123-4567';
const PHONE_TEL = '+15551234567';

const EMAIL = 'resonationsystems@gmail.com';

/* ── Handouts ─────────────────────────────────────────────────────────────────
   TODO(handout): point these at the real hosted PDFs when they exist. Until then
   both cards are dead links ("#") — exactly as the design shipped them. */
const HANDOUT_BOOKING_URL = '#';
const HANDOUT_CHECKLIST_URL = '#';

/* ── The video library ────────────────────────────────────────────────────────
   Each entry becomes a card. Paste an unlisted YouTube video's ID into "youtube"
   and that card turns into a real embed; leave it empty and it stays a "Coming
   soon" placeholder. No other change is needed to add a video — just commit and
   let Vercel redeploy.

   The ID is the part after "v=" in a YouTube URL:
   https://www.youtube.com/watch?v=dQw4w9WgXcQ  ->  youtube: 'dQw4w9WgXcQ'

   Embeds are served from youtube-nocookie.com, which does not set advertising
   cookies on a client who never presses play. */
const VIDEOS = {
  start: [
    { step: 'Step 1', title: 'Welcome & first sign-in', dur: '3 min', desc: 'Log in for the first time and get oriented to your dashboard.', youtube: '' },
    { step: 'Step 2', title: 'Your park basics', dur: '6 min', desc: 'Name, logo, colors, contact info, and your cancellation policy.', youtube: '' },
    { step: 'Step 3', title: 'Add your sites & pricing', dur: '8 min', desc: 'Create your campsites and set nightly, weekly, and monthly rates.', youtube: '' },
    { step: 'Step 4', title: 'Photos & your park map', dur: '5 min', desc: 'Upload photos and set up the interactive, clickable site map.', youtube: '' }
  ],
  run: [
    { step: 'Bookings', title: 'Taking & managing reservations', dur: '7 min', desc: 'How guests book, and how you view, edit, and check them in.', youtube: '' },
    { step: 'Payments', title: 'Guest folios & taking payment', dur: '6 min', desc: "Charges, add-ons, deposits, and running a guest's folio.", youtube: '' },
    { step: 'Camp Store', title: 'The Camp Store & Square Terminal', dur: '8 min', desc: 'Sell firewood, ice, and merch, and pair your card reader.', youtube: '' },
    { step: 'Electric', title: 'Electric meter billing', dur: '5 min', desc: 'Record readings and send tidy kWh statements to campers.', youtube: '' },
    { step: 'Seasonal', title: 'Seasonal campers & contracts', dur: '7 min', desc: 'Long-term campers, signed contracts, and waivers.', youtube: '' },
    { step: 'Team', title: 'The shared to-do board', dur: '4 min', desc: 'Keep your staff on the same page with tasks and reminders.', youtube: '' }
  ]
};

/* ── Rendering ──────────────────────────────────────────────────────────────── */

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// JSON destined for a <script> block: the escaped "<" keeps a "</script>" inside
// any future title or description from ending the block early.
function jsonForScript(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

const STYLE = `
  :root{
    --bg:#f4f2ea; --surface:#fffdf7; --surface-2:#efece1; --sink:#e9e5d8;
    --ink:#1e2a20; --muted:#5f6d60; --faint:#8b978a; --line:#e2ddce;
    --accent:#1a6b41; --accent-strong:#14532d; --accent-soft:#dfeee4; --tip:#a8631c;
    --btn-ink:#fff;
  }
  :root:not([data-theme="light"]){
    @media (prefers-color-scheme:dark){
      --bg:#10140d; --surface:#191f14; --surface-2:#222a1b; --sink:#0c110a;
      --ink:#edf0e4; --muted:#9aa891; --faint:#6f7c68; --line:#2b3524;
      --accent:#5cb884; --accent-strong:#7fcc9f; --accent-soft:#1d2a1f; --tip:#d69a4e;
    }
  }
  :root[data-theme="dark"]{
    --bg:#10140d; --surface:#191f14; --surface-2:#222a1b; --sink:#0c110a;
    --ink:#edf0e4; --muted:#9aa891; --faint:#6f7c68; --line:#2b3524;
    --accent:#5cb884; --accent-strong:#7fcc9f; --accent-soft:#1d2a1f; --tip:#d69a4e;
  }

  *{box-sizing:border-box}
  html{-webkit-text-size-adjust:100%}
  body{
    margin:0; background:var(--bg); color:var(--ink);
    font-family:"Hanken Grotesk",system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
    font-size:16.5px; line-height:1.6; -webkit-font-smoothing:antialiased;
  }
  a{color:var(--accent)}
  h1,h2,h3{font-family:"Fraunces",Georgia,serif; font-optical-sizing:auto; text-wrap:balance}

  /* ── Support bar: always visible, both states ── */
  .support-bar{
    background:var(--accent-strong); color:#eaf5ee;
    font-size:14.5px; font-weight:500;
    display:flex; flex-wrap:wrap; gap:6px 26px; justify-content:center; align-items:center;
    padding:11px 20px; text-align:center;
  }
  .support-bar strong{color:#fff; font-weight:700}
  .support-bar a{color:#fff; text-decoration:none; font-weight:600; border-bottom:1px solid rgba(255,255,255,.45)}
  .support-bar .sep{opacity:.5}

  /* ── Gate ── */
  .gate{min-height:calc(100vh - 46px); display:grid; place-items:center; padding:40px 22px}
  .gate-card{
    width:100%; max-width:440px; background:var(--surface); border:1px solid var(--line);
    border-radius:22px; padding:40px 36px; text-align:center;
    box-shadow:0 24px 60px -30px rgba(20,50,35,.35);
  }
  .mark{
    width:52px; height:52px; margin:0 auto 20px; border-radius:14px;
    background:var(--accent); color:#fff; display:grid; place-items:center;
    font-family:"Fraunces",serif; font-weight:600; font-size:26px;
  }
  .gate-card .eyebrow{font-size:12px; font-weight:600; letter-spacing:.16em; text-transform:uppercase; color:var(--accent); margin:0 0 8px}
  .gate-card h1{font-size:1.7rem; font-weight:500; margin:0 0 8px; line-height:1.12}
  .gate-card p{color:var(--muted); font-size:.98rem; margin:0 0 24px}
  .field{display:flex; gap:8px}
  .field input{
    flex:1; font:inherit; font-size:16px; padding:13px 15px; border-radius:11px;
    border:1px solid var(--line); background:var(--sink); color:var(--ink);
  }
  .field input:focus-visible{outline:2px solid var(--accent); outline-offset:1px; border-color:var(--accent)}
  .btn{
    font:inherit; font-weight:600; font-size:15.5px; cursor:pointer; white-space:nowrap;
    background:var(--accent); color:var(--btn-ink); border:0; border-radius:11px; padding:0 22px;
    transition:transform .16s ease, background .16s ease;
  }
  .btn:hover{transform:translateY(-1px); background:var(--accent-strong)}
  .btn:focus-visible{outline:3px solid var(--accent-soft); outline-offset:2px}
  .err{color:#c0492e; font-size:.9rem; margin:14px 0 0; min-height:1.1em; font-weight:600}
  :root:not([data-theme="light"]) @media (prefers-color-scheme:dark){.err{color:#f0a58c}}
  .gate-help{margin-top:22px; font-size:.9rem; color:var(--faint)}

  /* ── App (unlocked) ── */
  .app{display:none}
  .app.show{display:block}
  .wrap{max-width:1000px; margin:0 auto; padding:0 24px}

  .hero{padding:56px 0 8px; text-align:center}
  .hero .eyebrow{font-size:12.5px; font-weight:600; letter-spacing:.16em; text-transform:uppercase; color:var(--accent); margin:0 0 14px}
  .hero h1{font-size:clamp(2.1rem,5.4vw,3.1rem); font-weight:500; line-height:1.06; margin:0 0 14px}
  .hero p{color:var(--muted); font-size:1.12rem; max-width:56ch; margin:0 auto}

  /* Big warm support card */
  .care{
    margin:40px 0 8px; background:linear-gradient(150% 130% at 0% 0%, var(--accent-soft), var(--surface) 70%);
    border:1px solid var(--line); border-radius:20px; padding:28px 30px;
    display:flex; flex-wrap:wrap; gap:20px 34px; align-items:center; justify-content:space-between;
  }
  .care .lead{max-width:34ch}
  .care h2{font-size:1.4rem; font-weight:500; margin:0 0 6px}
  .care p{margin:0; color:var(--muted); font-size:.98rem}
  .care .ways{display:flex; flex-wrap:wrap; gap:12px}
  .way{
    display:flex; align-items:center; gap:11px; background:var(--surface); border:1px solid var(--line);
    border-radius:13px; padding:12px 16px; text-decoration:none; color:var(--ink); font-weight:600;
    transition:transform .16s ease, border-color .16s ease;
  }
  .way:hover{transform:translateY(-2px); border-color:var(--accent)}
  .way .ic{width:34px; height:34px; border-radius:9px; background:var(--accent-soft); color:var(--accent); display:grid; place-items:center; flex:none}
  .way .ic svg{width:18px; height:18px; fill:none; stroke:currentColor; stroke-width:1.9}
  .way small{display:block; font-weight:500; color:var(--faint); font-size:.78rem; letter-spacing:.02em}

  /* Section headers */
  .sec{margin-top:56px}
  .sec-head{display:flex; align-items:baseline; gap:14px; margin-bottom:20px}
  .sec-head h2{font-size:1.55rem; font-weight:500; margin:0}
  .sec-head .kick{font-size:12px; font-weight:600; letter-spacing:.14em; text-transform:uppercase; color:var(--accent)}
  .sec > p.intro{color:var(--muted); margin:-8px 0 22px; max-width:60ch}

  /* Video grid */
  .grid{display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:22px}
  .vid{background:var(--surface); border:1px solid var(--line); border-radius:16px; overflow:hidden; display:flex; flex-direction:column;
       transition:transform .18s ease, box-shadow .18s ease}
  .vid:hover{transform:translateY(-3px); box-shadow:0 18px 40px -26px rgba(20,50,35,.5)}
  /* PLACEHOLDER thumb. Replace this whole .thumb block with your YouTube <iframe> when you have it. */
  .thumb{
    position:relative; aspect-ratio:16/9;
    background:
      radial-gradient(80% 120% at 30% 20%, color-mix(in srgb,var(--accent) 26%, var(--surface-2)) 0%, var(--surface-2) 70%);
    display:grid; place-items:center;
  }
  .thumb::after{content:""; position:absolute; inset:0; background:linear-gradient(180deg, transparent 55%, rgba(0,0,0,.10))}
  .play{width:56px; height:56px; border-radius:50%; background:rgba(255,255,255,.92); display:grid; place-items:center; position:relative; z-index:1;
        box-shadow:0 6px 18px rgba(20,50,35,.28)}
  .play::before{content:""; border-style:solid; border-width:9px 0 9px 15px; border-color:transparent transparent transparent var(--accent-strong); margin-left:3px}
  .dur{position:absolute; z-index:1; right:10px; bottom:10px; background:rgba(15,25,18,.82); color:#fff; font-size:12px; font-weight:600; padding:3px 8px; border-radius:6px; letter-spacing:.02em}
  .soon{position:absolute; z-index:1; left:10px; top:10px; background:var(--tip); color:#fff; font-size:11px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; padding:3px 9px; border-radius:6px}
  .vid .body{padding:16px 18px 20px}
  .vid .step{font-size:12px; font-weight:600; letter-spacing:.04em; color:var(--accent); text-transform:uppercase}
  .vid h3{font-size:1.12rem; font-weight:600; margin:5px 0 6px; line-height:1.2}
  .vid p{margin:0; color:var(--muted); font-size:.93rem; line-height:1.5}

  /* Downloads */
  .docs{display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:16px}
  .doc{display:flex; gap:14px; align-items:center; background:var(--surface); border:1px solid var(--line); border-radius:14px; padding:16px 18px; text-decoration:none; color:var(--ink);
       transition:border-color .16s ease, transform .16s ease}
  .doc:hover{border-color:var(--accent); transform:translateY(-2px)}
  .doc .ic{width:40px; height:40px; border-radius:10px; background:var(--accent-soft); color:var(--accent); display:grid; place-items:center; flex:none}
  .doc .ic svg{width:20px; height:20px; fill:none; stroke:currentColor; stroke-width:1.8}
  .doc b{display:block; font-weight:600}
  .doc small{color:var(--faint)}

  footer{margin-top:64px; border-top:1px solid var(--line); padding:34px 0 60px; text-align:center; color:var(--muted); font-size:.96rem}
  footer .sign{font-family:"Fraunces",serif; font-style:italic; color:var(--ink); font-size:1.08rem; margin-top:4px}

  @media (max-width:560px){ .care{flex-direction:column; align-items:flex-start} }
  @media (prefers-reduced-motion:reduce){*{transition:none!important}}
`;

const SUPPORT_BAR = `
<div class="support-bar">
  <span>🌲 <strong>Real people, real help.</strong> We're here whenever you need us —</span>
  <span>call <a href="tel:${PHONE_TEL}">${PHONE_DISPLAY}</a></span>
  <span class="sep">·</span>
  <span>email <a href="mailto:${EMAIL}">${EMAIL}</a></span>
</div>
`;

// Rendered on the client so the video list above stays a plain list to edit.
const APP_SCRIPT = `
  var VIDEOS = ${jsonForScript(VIDEOS)};

  function attr(s){ return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function card(v){
    var media = v.youtube
      ? '<div class="thumb" style="padding:0"><iframe width="100%" height="100%" style="border:0;aspect-ratio:16/9" '+
        'src="https://www.youtube-nocookie.com/embed/'+encodeURIComponent(v.youtube)+'" title="'+attr(v.title)+'" '+
        'referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe></div>'
      : '<div class="thumb"><span class="soon">Coming soon</span><span class="play"></span><span class="dur">'+attr(v.dur)+'</span></div>';
    return '<article class="vid">'+media+
      '<div class="body"><span class="step">'+attr(v.step)+'</span>'+
      '<h3>'+attr(v.title)+'</h3><p>'+attr(v.desc)+'</p></div></article>';
  }
  function fill(id, list){ document.getElementById(id).innerHTML = list.map(card).join(''); }

  fill('startGrid', VIDEOS.start);
  fill('runGrid', VIDEOS.run);
`;

function shell(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,ital,wght@9..144,0,400;9..144,0,500;9..144,0,600;9..144,1,500&family=Hanken+Grotesk:wght@400;500;600;700&display=swap">
<style>${STYLE}</style>
</head>
<body>
${SUPPORT_BAR}
${body}
</body>
</html>`;
}

/** The sign-in card. `error` is shown in the reserved line under the field. */
function renderGate(options) {
  const error = (options && options.error) || '';
  return shell('ResoNation Learning Center', `
<div class="gate" id="gate">
  <div class="gate-card">
    <div class="mark">R</div>
    <p class="eyebrow">ResoNation · Client Learning Center</p>
    <h1>Welcome back</h1>
    <p>Enter the access code we gave you to reach your setup videos and guides.</p>
    <form class="field" method="post" action="/learn" autocomplete="off">
      <input type="password" name="code" placeholder="Access code" aria-label="Access code" autocomplete="off" autofocus>
      <button class="btn" type="submit">Enter</button>
    </form>
    <p class="err" role="alert">${esc(error)}</p>
    <p class="gate-help">Don't have your code? Just call or email us above — we'll get you in.</p>
  </div>
</div>
`);
}

/** The unlocked page. Only ever called once the session cookie has checked out. */
function renderApp() {
  return shell('ResoNation Learning Center', `
<main class="app show">
  <div class="wrap">

    <section class="hero">
      <p class="eyebrow">Your Learning Center</p>
      <h1>Everything you need to set up and master your ResoNation site</h1>
      <p>Short, friendly walkthroughs — watch, follow along in your own dashboard, and you'll be taking reservations before you know it. Go in order, or jump to whatever you need.</p>
    </section>

    <section class="care">
      <div class="lead">
        <h2>Stuck? We've got you.</h2>
        <p>You'll never be left figuring it out alone. Reach a real person any time — most questions are answered the same day.</p>
      </div>
      <div class="ways">
        <a class="way" href="tel:${PHONE_TEL}">
          <span class="ic"><svg viewBox="0 0 24 24"><path d="M4 5c0 8 7 15 15 15l0-4-4-2-2 2c-2-1-4-3-5-5l2-2-2-4z"/></svg></span>
          <span>Call us<small>${PHONE_DISPLAY}</small></span>
        </a>
        <a class="way" href="mailto:${EMAIL}">
          <span class="ic"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg></span>
          <span>Email us<small>${EMAIL}</small></span>
        </a>
      </div>
    </section>

    <!-- ══ START HERE ══ -->
    <section class="sec">
      <div class="sec-head"><span class="kick">Start here</span><h2>Your first hour</h2></div>
      <p class="intro">The essentials to get your park live. Do these in order and you're ready to accept your first booking.</p>
      <div class="grid" id="startGrid"></div>
    </section>

    <!-- ══ RUNNING YOUR PARK ══ -->
    <section class="sec">
      <div class="sec-head"><span class="kick">Day to day</span><h2>Running your park</h2></div>
      <p class="intro">Everything that happens after the first booking — payments, the camp store, seasonal campers, and more.</p>
      <div class="grid" id="runGrid"></div>
    </section>

    <!-- ══ DOWNLOADS ══ -->
    <section class="sec">
      <div class="sec-head"><span class="kick">Handouts</span><h2>Guides to keep</h2></div>
      <div class="docs">
        <a class="doc" href="${HANDOUT_BOOKING_URL}">
          <span class="ic"><svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/></svg></span>
          <span><b>Connect your booking page</b><small>Add a “Book Now” button to your site</small></span>
        </a>
        <a class="doc" href="${HANDOUT_CHECKLIST_URL}">
          <span class="ic"><svg viewBox="0 0 24 24"><path d="M4 5h16M4 12h16M4 19h10"/></svg></span>
          <span><b>Quick-start checklist</b><small>Every setup step on one page</small></span>
        </a>
      </div>
    </section>

    <footer>
      <p>Questions any time — <a href="tel:${PHONE_TEL}">${PHONE_DISPLAY}</a> · <a href="mailto:${EMAIL}">${EMAIL}</a></p>
      <p class="sign">We're so glad you're here. — The ResoNation team</p>
    </footer>

  </div>
</main>
<script>${APP_SCRIPT}</script>
`);
}

/*
 * Vercel does not build underscore-prefixed files in /api into endpoints. If that
 * ever changes, this makes the accidental endpoint a plain 404 rather than
 * something that could hand back the page.
 */
function notAnEndpoint(req, res) {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('Not found');
}

module.exports = notAnEndpoint;
module.exports.renderGate = renderGate;
module.exports.renderApp = renderApp;
