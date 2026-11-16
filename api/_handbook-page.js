'use strict';

/*
 * The Owner Handbook, served from behind the same gate as the Learning Center.
 *
 * It used to live in resonation-admin as public/handbook.html — a plain static
 * file on the admin console, which meant anyone who guessed the URL could read
 * it, and it sat on the wrong site besides. It belongs here, next to the videos,
 * where a client reaches it with the access code they already have.
 *
 * Same rules as _learn-page.js: this file lives in /api so Vercel never serves
 * it as a static file, the underscore prefix keeps it from becoming an endpoint
 * of its own, and the 404 handler at the bottom is the second line of defence.
 * api/learn.js is the only thing that calls renderHandbook(), and only once the
 * session cookie has checked out.
 *
 * Deliberately contains no prices and no plan costs — those change, and a
 * handbook that quotes them goes stale the day they do. Plan NAMES are fine and
 * are used throughout, so an owner always knows what they have.
 */

/* Kept in step with _learn-page.js by hand. Both files show these to clients. */
const PHONE_DISPLAY = '(970) 629-2788';
const PHONE_TEL = '+19706292788';
const EMAIL = 'resonationsystems@gmail.com';

/* The handbook's own look, copied from the original handbook.html. The embedded
   Manrope web font that file carried has been replaced with the Google Fonts
   link in the shell below — same typeface, ~94 KB less page. */
const STYLE = `:root { --ink1:#143225; --ink2:#43614D; --sage:#6E836F; --gold:#B0894C;
    --cream:#E6E7E2; --sage-l:#C7CDBF; --line:#e2e6df; --body:#33403a; --muted:#6b776f; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--cream); color:var(--body);
    font-family:'Manrope',-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
    font-size:16px; line-height:1.65; -webkit-font-smoothing:antialiased; }
  .hero { background:#fff; border-bottom:1px solid var(--line); padding:34px 24px 28px; text-align:center; }
  .logo { width:340px; max-width:82%; height:auto; display:block; margin:0 auto; }
  .tagline { margin:14px 0 0; color:var(--ink2); font-weight:500; font-size:16px; }
  .wrap { max-width:770px; margin:0 auto; padding:26px 22px 64px; }
  .card { background:#fff; border:1px solid var(--line); border-radius:18px;
    padding:16px 36px 40px; box-shadow:0 10px 34px rgba(20,50,37,.05); }
  h2 { font-size:22px; font-weight:800; color:var(--ink1); margin:34px 0 12px; padding-top:24px;
    border-top:2px solid var(--sage-l); position:relative; letter-spacing:-.3px; }
  h2::before { content:""; position:absolute; top:-2px; left:0; width:52px; height:2px; background:var(--gold); }
  .card > h2:first-of-type { border-top:none; padding-top:6px; }
  .card > h2:first-of-type::before { display:none; }
  h3 { font-size:17px; font-weight:700; color:var(--ink2); margin:22px 0 8px; }
  p { margin:0 0 13px; }
  a { color:var(--ink2); font-weight:600; }
  ul,ol { margin:0 0 14px; padding-left:22px; } li { margin:6px 0; } li::marker { color:var(--sage); }
  strong { color:var(--ink1); font-weight:700; } hr { display:none; }
  blockquote { margin:16px 0; padding:14px 18px; background:#f3f6f1;
    border-left:4px solid var(--gold); border-radius:0 12px 12px 0; } blockquote p { margin:0; }
  table { width:100%; border-collapse:collapse; margin:10px 0 18px; font-size:14.5px; }
  th,td { text-align:left; padding:10px 11px; border-bottom:1px solid var(--line); }
  th { background:var(--ink1); color:#fff; font-weight:700; } tr:nth-child(even) td { background:#f7f9f6; }
  code { background:#eef2ec; border:1px solid #dde5da; border-radius:5px; padding:1px 6px;
    font-family:ui-monospace,Menlo,monospace; font-size:13px; }
  .foot { text-align:center; color:var(--muted); font-size:13px; padding:24px 8px 0; }
  .foot .m { font-weight:800; color:var(--ink2); }

  /* Added when the handbook moved behind the /learn gate: a way back, and a
     contents list, since this page is now one of several. */
  .backbar { background:var(--ink1); padding:10px 22px; }
  .backbar a { display:inline-flex; align-items:center; gap:8px; color:#fff;
    font-size:13.5px; font-weight:600; text-decoration:none; opacity:.92; }
  .backbar a:hover { opacity:1; text-decoration:underline; }
  .toc { background:#f3f6f1; border:1px solid var(--line); border-radius:14px;
    padding:18px 22px; margin:0 0 26px; }
  .toc h3 { margin:0 0 10px; font-size:13px; letter-spacing:.14em;
    text-transform:uppercase; color:var(--sage); font-weight:700; }
  .toc ol { margin:0; padding-left:20px; columns:2; column-gap:30px; font-size:14.5px; }
  .toc li { margin:4px 0; break-inside:avoid; }
  .toc a { text-decoration:none; } .toc a:hover { text-decoration:underline; }
  @media (max-width:620px) { .toc ol { columns:1; } .card { padding:14px 20px 30px; } }
  @media print { .backbar, .toc { display:none; } .card { box-shadow:none; border:none; } }
`;

const TOC = [
  'Logging in',
  'Your park details &amp; branding',
  'Connect Square',
  'Add your sites',
  'Rates, rules &amp; availability',
  'Taxes, fees, pets and extras',
  'Your booking page &amp; your park map',
  'Your cancellation policy',
  'Putting your link on your website',
  'Going live',
  'Taking &amp; managing reservations',
  'Your guests',
  'Emailing your guests',
  'The Camp Store',
  'Money &amp; reporting',
  'Your team',
  'The to-do board',
  'The Long Term Command Center',
  'Seasonal contracts',
  'Seasonal &amp; monthly accounts',
  'Electric billing &amp; the meter walk',
  'Keeping long-term campers in the loop',
  'Moving your records in',
  'Your plan',
  'Getting help',
];

const BODY = `<p>Congratulations — your reservation site is live and ready for you to make it your own. This handbook walks you through everything, in the order that makes setup easiest. You don't have to do it all at once; work through it at your own pace. Most owners are taking real bookings within an afternoon.</p>

<p>A few features depend on which plan you're on — Trailhead, Ridgeline or Summit — and we point those out as we go, so you always know what's included and what's a quick upgrade away. Everything else in here is on every plan.</p>

<p>As you get set up, you have a real person to help. Reach out any time — contact details are at the end.</p>

<hr />

<h2>The 15-minute quick start</h2>

<p>If you like to dive in, here's the short version. Each step is explained in full below.</p>

<ol>
<li><strong>Log in</strong> to your admin dashboard — the link and your first password are in your welcome email.</li>
<li><strong>Add your park details</strong> — name, contact info, your logo and your color.</li>
<li><strong>Connect Square</strong> so you can accept payments.</li>
<li><strong>Add your sites</strong> — your RV spots, tent sites and cabins, with their rates and photos.</li>
<li><strong>Preview your booking page</strong>, then share the link.</li>
</ol>

<p>That's the core. Everything else — your rules, your taxes, your cancellation policy, your staff logins — makes it better, and you can layer those in whenever you're ready.</p>

<hr />

<h2>Part One · Getting set up</h2>

<p>These are the things worth doing before you take your first booking. Roughly in order, though nothing stops you jumping around.</p>

<hr />

<h2>1. Logging in</h2>

<p>Your welcome email has two things: a link to your admin dashboard and your first password. The dashboard is your control center — it's where you manage every setting, see your calendar and take reservations.</p>

<p>Bookmark that link so it's always a click away. When you first log in, change your password to something you'll remember — look for <strong>Account</strong> in your dashboard. That screen is yours alone; every person who works at your park gets their own login and changes their own password there.</p>

<blockquote>
<p><strong>You don't share a login.</strong> When your summer help starts, you give them their own account rather than your password — see <em>Your team</em> in Part Two. It means you can take someone's access away without changing anything for anyone else.</p>
</blockquote>

<hr />

<h2>2. Your park details &amp; branding</h2>

<p>This is what your campers see, so it's worth getting right first.</p>

<p><strong>Park name and contact info.</strong> Enter your campground's name, phone number and email. Your phone number matters more than you'd think — it shows up on your booking page and in confirmation emails, and it's the number campers call with questions.</p>

<p><strong>Your logo.</strong> Upload your logo and it appears across your booking page and confirmation emails. Don't have a digital logo yet? No problem — until you upload one, your site shows a clean badge with your park's initials in your brand color, so nothing ever looks unfinished.</p>

<p><strong>Your color.</strong> Pick your accent color and the whole site — buttons, highlights, the map — picks it up, so your booking page feels like your campground, not generic software.</p>

<hr />

<h2>3. Connect Square (so you can get paid)</h2>

<p>To collect payments from campers, connect your Square account. ResoNation uses Square to process cards, so this is the step that turns your site into a real booking system rather than just a calendar. <strong>The money goes straight to your Square account</strong> — we never hold it, and there's no per-booking commission.</p>

<p>If you already have Square, connecting takes a minute. If you don't, you'll create a free Square account first, then link it. Once connected, campers can pay when they book, and you can take payments yourself for phone or walk-in reservations.</p>

<p><strong>Taking cards in person.</strong> If you want to accept cards face to face — tap or swipe at your front desk or out at a campsite — you'll need Square's card reader, the <strong>Square Terminal</strong>, which you buy separately from Square. Without a reader you can still key in card details manually, and campers can always pay online themselves when they book. So the Terminal is optional; it's only needed if you want tap-and-swipe in person.</p>

<p>A couple of things worth setting while you're here: whether you pass card-processing fees along as a small surcharge, and how deposits work for your park. If you're not sure, leave the defaults — you can always adjust later.</p>

<blockquote>
<p><strong>Important:</strong> until Square is connected, your site can take reservations but not payments. This is the one step you don't want to skip before going live.</p>
</blockquote>

<hr />

<h2>4. Add your sites</h2>

<p>Now the heart of it — the actual spots campers book. For each site you'll set:</p>

<ul>
<li><strong>Site number or name</strong> — whatever you already call it ("12", "T4", "Lakeside Cabin").</li>
<li><strong>Type</strong> — RV site, tent site, cabin, yurt, tiny home, lodge room, glamping or treehouse.</li>
<li><strong>Hookups</strong> — tick water, electric and sewer, in whatever combination the site really has. All three is a full hookup; nothing ticked reads <em>Primitive — no hookups</em>, which is right for a bare tent pad.</li>
<li><strong>Electric service</strong> — tick every amp the pedestal offers: 15, 20, 30, 50. Most pedestals offer two or three, so tick them all.</li>
<li><strong>Nightly rate</strong> — what it costs per night.</li>
<li><strong>Description</strong> — a short, inviting line campers see ("Full-hookup pull-through with morning shade").</li>
<li><strong>Photos</strong> — add photos by drag-and-drop. A picture of the actual spot — the shade, the view, the fire ring — sells it better than any description, so it's worth the minute.</li>
</ul>

<p><strong>Any site type can have hookups.</strong> A lodge room with power, a yurt with water and electric, a tent pad with a 20-amp outlet — tick what is really there. Hookups are not only for RV sites.</p>

<p>Add them in any order; the site handles sorting. If you have a lot of similar sites — twenty full-hookup RV spots at the same rate — set one up the way you like it and the rest go quickly.</p>

<hr />

<h2>5. Rates, rules &amp; availability</h2>

<p>Your nightly rate is just the starting point. Set the rules once and your booking page enforces them for you, with no babysitting:</p>

<ul>
<li><strong>Seasons and pricing rules</strong> — charge more for holidays, weekends or peak season without touching your base rates day to day.</li>
<li><strong>Minimum-stay rules</strong> — require a two- or three-night minimum over a holiday weekend.</li>
<li><strong>Blocked dates</strong> — close specific dates for maintenance, a private event or the off-season, and campers simply can't book them.</li>
</ul>

<p>Premium spots — lakefront, pull-through, extra space — can and should cost more. Campers expect it.</p>

<hr />

<h2>6. Taxes, fees, pets and extras</h2>

<p>The small print of what a stay actually costs. All of it is on every plan, and all of it is yours to set.</p>

<p><strong>Sales tax.</strong> Set your tax up the way your state and county actually work, and it's calculated and recorded on every transaction — reservations, store sales, everything. When it's time to file, the numbers are already separated out rather than buried in a total.</p>

<p><strong>Fees.</strong> Extra guest fees, your card surcharge if you use one, and any other charge your park applies.</p>

<p><strong>Pets.</strong> Set a per-pet fee, mark which sites are pet-friendly, and the booking page handles the rest. <strong>Service animals are never charged</strong> — that's built in, not something you have to remember.</p>

<p><strong>Add-ons and extras.</strong> Sell firewood, ice, a bundle of kindling or a kayak rental right in the booking flow, so campers add them while they're already paying.</p>

<p><strong>Discount codes.</strong> Run a promotion, reward a repeat guest, or give the campground association rate its own code.</p>

<hr />

<h2>7. Your booking page &amp; your park map</h2>

<p>Your booking page is the public link campers use to see availability and reserve. Preview it any time to see exactly what they'll see.</p>

<p><strong>Your park map — Ridgeline and Summit.</strong> We draw your park by hand as part of getting you set up: your roads, your loops, the pond, the bath house, every site in its real place. Campers see it color-coded and live, and tap the exact spot they want. It's the thing people comment on, and you don't have to make it — it's part of your onboarding, and we build it from an aerial photo and a conversation with you.</p>

<p>On <strong>Trailhead</strong>, campers choose their site from a clean list instead. You can add the map any time by moving up to Ridgeline.</p>

<p>When your booking page looks the way you want, that link is what you'll share everywhere — more on that in <em>Going live</em>.</p>

<hr />

<h2>8. Your cancellation policy</h2>

<p>Decide how you want to handle cancellations and refunds, and set it here so it's clear to campers up front and applied consistently.</p>

<p>You can set a refund schedule — a full refund more than a week out, a partial refund closer in, nothing at the last minute — along with your deadline and any non-refundable deposit. Your policy shows on the booking page, so there are no surprises and no arguments.</p>

<p><strong>Changes and cancellations come through you.</strong> A camper who needs to change dates or cancel calls or emails you, and you make the change from your dashboard. We've deliberately kept it that way: for most parks, a conversation about moving a reservation is worth having, and it stops a camper cancelling a holiday weekend at midnight with nobody to talk them into rebooking.</p>

<hr />

<h2>9. Putting your link on your website</h2>

<p>Your booking page has an address of its own from the day you start. Most parks would rather it looked like part of their own site — <strong>book.yourpark.com</strong> rather than something generic. That's a small, one-time job, and we do our half of it.</p>

<p><strong>If you have a website.</strong> It takes two halves of one handshake. We claim <em>book.yourpark.com</em> on our side, and one record gets added wherever your domain is managed — GoDaddy, Namecheap, Squarespace, Wix, whoever you bought it from. We send you the exact record; it points that one name at your booking page and touches nothing else about your website. Once both halves are done it works, and the security certificate is taken care of for you.</p>

<p>Then put a <strong>Book Now</strong> button on your site pointing at it. In your main menu and on your home page — those are the two places campers look first.</p>

<p><strong>If someone else runs your website.</strong> That's the usual case and it's no harder. Forward them the record we send you. For anyone who has seen a domain settings panel it's a two-minute job, and nothing else about your site changes. Your booking page keeps working the whole time, at its original address, until the new one takes over.</p>

<p><strong>If you don't have a website.</strong> You don't need one. Your booking page already is one — your logo, your colors, your photos, your rates, your policies and your contact details, on a page that works on a phone. Put the link on your Facebook page, your Google Business profile and anywhere else campers look for you, and that is a real web presence. Plenty of parks run on exactly that. If you buy a domain later we can point it straight at your booking page, so it simply becomes <em>yourpark.com</em>.</p>

<blockquote>
<p>Either way, ask us rather than working it out alone. We've done this for every park on ResoNation, and we'll walk you or your web person through it.</p>
</blockquote>

<hr />

<h2>10. Going live</h2>

<p>Before you share your link, a quick final check:</p>

<ul>
<li>Park details, logo and color look right</li>
<li>Square is connected</li>
<li>All your sites are added, with correct rates, hookups and photos</li>
<li>Your rates, minimum stays and blocked dates are set</li>
<li>Your taxes and fees are set</li>
<li>Your cancellation policy is set</li>
<li>You've previewed your booking page on a phone as well as a computer</li>
<li>Your booking link is on your website, your Facebook page and your Google Business profile</li>
</ul>

<p>Then share your booking link everywhere campers look for you. The easier it is to find, the more bookings come in on their own — while you're doing anything but sitting at a computer.</p>

<h2>Part Two · Running the park</h2>

<p>You're live. This part is the day-to-day — what you'll actually use once bookings are coming in.</p>

<hr />

<h2>11. Taking &amp; managing reservations</h2>

<p>Bookings arrive on their own through your booking page, and you can also create one yourself for a phone call or a walk-up. Either way it lands in the same place.</p>

<p><strong>Your dashboard</strong> is the first thing you see when you log in: who's arriving today, who's leaving, what's happening right now. Open it with your coffee and you know your day.</p>

<p><strong>The month view</strong> shows you the whole month at a glance — every site down the side, every day across the top. That's on every plan.</p>

<p><strong>The timeline calendar — Ridgeline and Summit.</strong> Slide across the weeks to see who is where and what frees up when, and drag a reservation to move it to another site or stretch it another night. It's the fastest way to shuffle a busy weekend. On Trailhead you make the same changes by opening the reservation and editing the dates — you lose the shortcut, not the ability.</p>

<p><strong>Check-in and check-out</strong> are a tap. Mark a guest arrived, mark them gone, and your dashboard and your occupancy stay honest.</p>

<p><strong>Liability waivers.</strong> Guests sign your waiver digitally, and the signed copy is stored with their reservation — no clipboard at the front desk, nothing to file, and nothing lost. On every plan.</p>

<p>Changes, extensions, site moves and cancellations all happen from the reservation itself. Refunds go back through Square to the card the guest paid with.</p>

<hr />

<h2>12. Your guests</h2>

<p>Every camper who books builds a record: their contact details, their rig, their pets, their stay history and their notes.</p>

<p><strong>Guest folios</strong> — on every plan — are the running account for a stay. Every charge, every payment, every refund on one page, so when a camper asks "what am I paying for?" you can show them rather than explain. Print it or email it.</p>

<p>Notes are the quiet superpower. "Prefers shade." "Dog is friendly, barks at bikes." "Asked about monthly next year." Jot it down and it's there next season, whoever's at the desk.</p>

<hr />

<h2>13. Emailing your guests — Ridgeline and Summit</h2>

<p>Confirmation emails go out automatically on every plan, in your colors, with your logo and your contact details.</p>

<p>On <strong>Ridgeline and Summit</strong> you can also write to your guests from inside your dashboard. Pick who gets it — everyone arriving this weekend, everyone in the seasonal area, one site, one person — write it once, and send. The water's off Tuesday morning. The road's washed out at the bottom gate. The potluck is Saturday at six. It goes out looking like it came from your park, because it did.</p>

<hr />

<h2>14. The Camp Store</h2>

<p>The Camp Store is an add-on you can switch on with any plan. It turns your dashboard into a point of sale: firewood, ice, propane, t-shirts, bundles of kindling, a bag of marshmallows.</p>

<p>Ring up a sale, take the card through Square, and it's recorded with your tax already separated out. Products have their own inventory, so you can see what's moving and what isn't. Sales show up in the same reports as your reservations, which means one number for the day rather than two sets of books.</p>

<p>If a camper has an open account — a seasonal or monthly camper — a store sale can go on their balance instead of their card.</p>

<hr />

<h2>15. Money &amp; reporting</h2>

<p><strong>Transactions</strong> is every payment, refund and sale, searchable, with who took it and when.</p>

<p><strong>Reports — Ridgeline and Summit.</strong> Occupancy, revenue, your tax to file, how your season compares to last season. The numbers are already there; the reports just arrange them so you can see what's actually happening rather than guessing.</p>

<p>Your money moves through your own Square account. Nothing sits with us, there's no commission on a booking, and what Square shows and what your dashboard shows are the same transactions.</p>

<hr />

<h2>16. Your team</h2>

<p>Everyone who works at your park gets their own login. There are three levels, and they matter:</p>

<table>
<thead>
<tr><th>Role</th><th>What they can do</th></tr>
</thead>
<tbody>
<tr><td><strong>Owner</strong></td><td>Everything — including your rates, your fees, your settings, your Square connection and who else has an account.</td></tr>
<tr><td><strong>Manager</strong></td><td>Runs the park day to day: reservations, guests, the store, reports, emailing guests, the seasonal side. Not your rates, fees or settings.</td></tr>
<tr><td><strong>Staff</strong></td><td>The front desk: take bookings, check guests in and out, ring up the store, look things up.</td></tr>
</tbody>
</table>

<p>A staff member cannot issue a refund or cancel a reservation. That isn't about trust — it's so the person who can undo money is the person who's accountable for it, and so a new hire can't make an expensive mistake on their second day.</p>

<p>Add your people as you hire them and remove them when the season ends. Nobody shares a password, and nobody has more access than their job needs.</p>

<hr />

<h2>17. The to-do board</h2>

<p>A shared list for the park. The pump house needs a new gauge. Site 14's fire ring is cracked. Mow the back loop before Friday.</p>

<p>Anyone on your team can add an item, claim it and tick it off, so the thing you noticed on your walk at seven in the morning doesn't live only in your head. It's on every plan.</p>

<h2>Part Three · Long-term campers — Summit</h2>

<p>If you have seasonal, monthly or long-term campers, this part is the reason Summit exists. A seasonal camper isn't a three-night reservation with a bigger number on it — it's a contract, a payment schedule, a meter reading and a relationship that runs for months. Summit handles all of that as its own thing.</p>

<hr />

<h2>18. The Long Term Command Center</h2>

<p>One screen for everyone who's staying with you long-term. Who's paid, who hasn't, whose contract isn't signed yet, whose electric is owed, who's up for renewal.</p>

<p>It's built to answer the question you actually have — <em>what needs chasing today?</em> — rather than making you check five places to find out. Open it once a week and you know where you stand.</p>

<hr />

<h2>19. Seasonal contracts</h2>

<p>Your seasonal agreement is stored in the system and sent to the camper to sign digitally. They sign on their phone; the signed copy lives with their record.</p>

<p>No printing, no scanning, no folder in a drawer, and no wondering whether the person on site 42 ever actually signed this year. The command center shows you who hasn't, which is the only reason anyone ever goes looking.</p>

<hr />

<h2>20. Seasonal &amp; monthly accounts</h2>

<p>A long-term camper has an account rather than a single payment. You set the schedule — a deposit, then monthly installments, or whatever your park does — and the system tracks what's due, what's paid and what's outstanding.</p>

<p>Campers can pay online against their balance, you can take a payment at the desk, and a store purchase can go on the account too. Everything lands on one statement, so when someone asks what they owe, there's a straight answer.</p>

<p>Their site is held for the season rather than sitting in your bookable inventory, so nobody can reserve it out from under them.</p>

<hr />

<h2>21. Electric billing &amp; the meter walk</h2>

<p>If you bill long-term campers for their own electric, this is the part that gives you your evening back.</p>

<p><strong>The meter walk</strong> is built for your phone. Walk the loop, tap a site, type the number off the meter, next site. The readings go in as you go. No clipboard, no transcribing later, no squinting at your own handwriting.</p>

<p>Then the system does the arithmetic — this reading minus last reading, times your rate — and produces the bill. You review it, you send it, and it posts to the camper's account. What used to be an evening at the kitchen table with a calculator is a walk around the park.</p>

<p>Set your rate per kilowatt-hour once in your settings. If a meter gets replaced or a reading is obviously wrong, you can correct it — the history stays visible so the numbers always add up.</p>

<hr />

<h2>22. Keeping long-term campers in the loop</h2>

<p>Long-term campers are your community, and they want to hear from you. The water's off Tuesday. The gate code changes the first of the month. Renewals open next week and here's your rate.</p>

<p>Email the whole seasonal area at once, or one camper, from the same place you email everybody else. They're not guests passing through; keeping them informed is most of what keeps them coming back.</p>

<h2>Part Four · The rest</h2>

<hr />

<h2>23. Moving your records in</h2>

<p>If you're coming from a spreadsheet, another system or a paper book, you don't have to retype your park.</p>

<p>Your sites and your guests can both be brought in from a spreadsheet — the sites with their types, hookups, amps and rates, the guests with their contact details and history. Send us what you've got, in whatever shape it's in, and we'll tell you what we can use. Most parks' records come over in one pass.</p>

<p>Existing reservations for the season ahead are worth a conversation rather than a bulk import — there are usually judgment calls about deposits and dates that are better made deliberately than automatically.</p>

<hr />

<h2>24. Your plan</h2>

<p>There are three plans, and the differences are about the size and shape of your park rather than how much software you're allowed.</p>

<table>
<thead>
<tr><th>Plan</th><th>What it adds</th></tr>
</thead>
<tbody>
<tr><td><strong>Trailhead</strong></td><td>The whole core: online booking, your sites and rates, the month calendar, guest records, folios, waivers, taxes and fees, add-ons, discount codes, your team, the to-do board, confirmation emails.</td></tr>
<tr><td><strong>Ridgeline</strong></td><td>Your hand-drawn park map on the booking page, the timeline calendar with drag-to-change, emailing your guests, and reports.</td></tr>
<tr><td><strong>Summit</strong></td><td>Everything for long-term campers: the Long Term Command Center, seasonal contracts, seasonal and monthly accounts, electric billing and the meter walk.</td></tr>
</tbody>
</table>

<p>The <strong>Camp Store</strong> is an add-on rather than a plan step — switch it on with any plan.</p>

<p>Moving up is a conversation, not a migration. Your data, your settings and your bookings stay exactly as they are; the new features simply appear. If you're not sure which plan fits your park, ask — we'd rather you were on the right one.</p>

<hr />

<h2>25. Getting help</h2>

<p>You have a real person, not a ticket queue.</p>

<p>Call, text or email any time. If something's wrong with your site, say so immediately — we'd much rather hear about it the hour it happens than find out next week that you've been working around it. And if something would be better a different way, tell us that too. Most of what's in this handbook exists because an owner asked for it.</p>

<p>There are also short videos in your Learning Center walking through the parts people ask about most.</p>`;

/*
 * The headings come out of BODY as plain <h2>. Numbering and ids are added here
 * rather than written into the markup, so renumbering a section is one edit to
 * TOC instead of two edits per heading.
 */
function numberHeadings(html) {
  let n = 0;
  return html.replace(/<h2>(\d+)\. /g, function (match, written) {
    n = Number(written);
    return '<h2 id="s' + n + '">' + n + '. ';
  });
}

function tocList() {
  return TOC.map(function (title, i) {
    return '<li><a href="#s' + (i + 1) + '">' + title + '</a></li>';
  }).join('');
}

/** The handbook page. Only ever called once the session cookie has checked out. */
function renderHandbook() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>The ResoNation Owner Handbook</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap">
<style>${STYLE}</style>
</head>
<body>
<nav class="backbar"><a href="/learn">&larr; Back to the Learning Center</a></nav>
<header class="hero">
  <img class="logo" src="/img/handbook-logo.webp" alt="ResoNation" width="760" height="490">
  <p class="tagline">The Owner Handbook &middot; everything, in the order that makes setup easiest</p>
</header>
<main class="wrap">
  <nav class="toc" aria-label="Contents">
    <h3>Contents</h3>
    <ol>${tocList()}</ol>
  </nav>
  <article class="card">
${numberHeadings(BODY)}
  </article>
  <p class="foot"><span class="m">ResoNation</span><br>
    Questions any time &mdash; <a href="tel:${PHONE_TEL}">${PHONE_DISPLAY}</a> &middot;
    <a href="mailto:${EMAIL}">${EMAIL}</a></p>
</main>
</body>
</html>`;
}

/*
 * Vercel does not build underscore-prefixed files in /api into endpoints. If that
 * ever changes, this makes the accidental endpoint a plain 404 rather than
 * something that could hand back the handbook.
 */
function notAnEndpoint(req, res) {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('Not found');
}

module.exports = notAnEndpoint;
module.exports.renderHandbook = renderHandbook;
