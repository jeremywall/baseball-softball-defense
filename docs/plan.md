# Little League Defensive Alignment Planner — Project Plan

## 1. Purpose

A static, client-side-only web app that generates a full-game defensive
lineup for a Little League team in seconds, in the last few minutes
before a game starts. The coach's workflow is intentionally just three
steps: check off who showed up, confirm a couple of game options, and tap
one button. The app then produces the entire inning-by-inning alignment
itself, following the tracked rules in §6 — there is deliberately **no
manual position-assignment UI**; hand-assigning players is the exact
time-pressure problem this tool exists to remove. If a generated
alignment isn't to the coach's liking, the fix is to tap the button again
for a fresh, differently-randomized alignment (§6.3), not to edit it by
hand.

The tracked hard and soft rules in §6 are the actual criteria for what
makes an alignment valid/good; the rules engine stays isolated and
pluggable there so new rules can be added without touching the rest of
the app (data model, UI).

## 2. Hosting & Tech Constraints

- **Static hosting only**: plain HTML/CSS/JS, no server, no build-required
  backend calls. Must work from a plain file server (GitHub Pages, Netlify,
  S3, etc.).
- **Client-side only**: all logic, storage, and state live in the browser.
  No API keys, no server-side database.
- **No mandatory build step.** Prefer hand-written HTML/CSS/ES modules that
  run directly in the browser via `<script type="module">`, so the site can
  be opened/served with zero tooling. A small optional dev convenience
  (e.g. a local static file server for testing) is fine, but nothing the
  deployed site depends on.
- **No framework dependency** (no React/Vue/etc.) unless a later need
  justifies it — keeps the "just static files" property simple and avoids
  build tooling. Use vanilla Web Components or small hand-rolled render
  functions for componentization.
- **No persistence**: all roster/game/alignment data lives only in
  in-memory app state for the current browser session. Nothing is written
  to localStorage, IndexedDB, cookies, or any server. A page refresh or
  close loses the data — this is expected; the app is a single-session
  working tool, not a data store. (If a coach wants to keep a result, they
  print it from the result state, §3/§5.)

## 3. Mobile-First UI Principles

- Design and build the small-screen layout first; expand to tablet/desktop
  with responsive breakpoints and CSS layout (flexbox/grid), not the reverse.
- **One screen, two states, no router.** The whole app is a single
  continuous scrollable page with no multi-page navigation and no
  page-level routing state:
  1. **Input state** — an attendance checklist plus the game options
     (innings, alignment mode, pitcher limit), ending in one primary
     button: **"Assign Positions."** This is the only input the coach ever
     gives; there is no separate screen or step before it.
  2. **Result state** — replaces the input state on the same page the
     moment the button is tapped, showing the two output tables (§5): the
     inning-by-position grid and the per-player section-time summary.
     There is no per-inning navigation, no field diagram, and nothing to
     tap-to-assign — the tables are the entire output, generated in one
     shot from the rules engine (§6).
  A **"Regenerate"** button re-runs the generator for a fresh (randomized,
  §6.3) alignment without re-entering attendance, and a **"Start Over"**
  button clears the result and returns to the input state so attendance
  can be re-checked for a different game.
- Primary interactions must work with touch: the attendance checklist and
  the three buttons are all that's tapped — large touch targets (≥44px),
  no drag-and-drop, nothing that requires precision.
- Both output tables can be wide (many innings, or many summary columns)
  — each scrolls horizontally within its own contained region so the page
  itself never scrolls sideways.
- Respect light/dark color scheme via CSS `prefers-color-scheme`.
- Works offline after first load (stretch goal: a simple service worker /
  web app manifest so it can be "installed" and used at a dugout with poor
  signal).

## 4. Core Domain Model (rules-agnostic)

These entities are needed regardless of what the final criteria look like,
so they can be built before criteria are finalized:

- **Team**: name, roster of Players, list of Games.
- **Player**: id, name, jersey number (optional — not all seasons' rosters
  have assigned it), position eligibility/preferences, attributes bag
  (open-ended key/value so future criteria can attach data, e.g.
  `{throwsHand, skillRating, canPitch, canCatch, ...}`). The roster itself
  is not created through the UI — see "Roster source" below.
- **Game**: id, date/opponent (optional), number of innings (one of a
  fixed set — 6, 7, 8, or 9 — chosen from a dropdown, not free entry),
  alignment mode (§5), pitcher inning limit setting (1 or 2, from the
  Game setup checkbox — see HR-9 in §6.1), list of Innings.
- **Inning**: number, mapping of Position → Player (or empty/bench), plus
  which players are sitting out that inning.
- **Position**: the standard defensive positions (Pitcher, Catcher, 1B, 2B,
  3B, SS, LF, CF, RF) plus "Bench"/"Out" for players not on the field. The
  set of fielded positions depends on the game's **alignment mode**, a
  per-game setting the user picks (see §5 Game setup):
  - **9-position mode**: the standard positions above (3 outfielders).
  - **10-position mode**: the same infield/battery plus a 4th outfielder
    (e.g. splitting the outfield into LF/LC/RC/RF, naming TBD alongside the
    rest of the criteria).
  Position definitions live in one config module keyed by alignment mode, so
  the result tables, rules engine, and auto-suggest all read from the same
  source rather than hardcoding a position count. Each position also
  carries a **category** used for the "innings played in infield/outfield"
  hard rules (HR-2, HR-5, HR-6 in §6.1): `infield` — **Pitcher, Catcher,
  1B, 2B, 3B, SS** (per league convention, the battery positions count as
  infield for these rules) — `outfield` (LF/CF/RF, plus the 4th outfielder
  in 10-position mode), or `bench`. Individual position identity (e.g.
  distinguishing Catcher from Pitcher) is always still tracked separately
  from category, since some rules key off the specific position rather
  than the category (e.g. HR-1, which is about catcher and pitcher
  specifically).
- **Constraint/Rule**: a named, independently pluggable unit (see §6) that
  can validate an Inning or a whole Game and report violations/warnings.

This model is represented as plain JSON in memory, which keeps it simple to
inspect/debug and easy to hand to the rules engine and views.

### Roster source

There is no persistence (§2), so the roster can't be built up and saved
through the UI session over session — instead the current season's roster
is **embedded directly in the HTML** as a small, plain data literal (e.g. a
`<script type="application/json" id="roster-data">` block, or a plain JS
array in a `const ROSTER = [...]` at the top of `src/data/roster.js`), and
the app loads it at startup. To set up a new season, a coach (or whoever
maintains the site) edits that one literal and redeploys the static files —
no build step or UI required. Example, seeded from the current roster:

```js
// src/data/roster.js
export const ROSTER = [
  "Ashton", "Ben", "Bennett", "Carson", "Henry", "Jaden",
  "James L", "James S", "Jameson", "Levi", "Lucas", "Ozzy",
];
```

Each entry is just a display name; the app assigns each an internal id at
load time. If a future season needs more than a name per player (jersey
number, position eligibility, etc.), the array upgrades from strings to
small objects (e.g. `{ name: "Ashton", number: 7 }`) — the loader should
accept either shape so a partial roster (names only) still works. The
in-app "present/absent for this game" selection (§5, Game setup) still
happens per game at runtime; only the season roster itself is edited in
source.

## 5. Feature Set (initial scope)

1. **Roster display** — load the season's roster from the embedded data
   (§4, Roster source) and show it as the attendance checklist. No in-app
   add/edit/remove UI for the season roster itself; updating the roster
   for a new season is a source-file edit + redeploy.
2. **Game options (input state, §3)** — before generating anything, the
   coach sets:
   - **Attendance**: the full season roster as a checklist (one checkbox
     per player, checked = present). Players left unchecked (absent) are
     excluded entirely — they cannot be generated into the lineup.
     Attendance defaults to unchecked (nobody present) so the coach must
     actively confirm who's there. An **"All Present" button** toggles the
     whole roster at once (checks everyone unless everyone is already
     checked, in which case it unchecks everyone).
   - **Number of innings**: a dropdown limited to the fixed set the league
     actually plays — **6, 7, 8, or 9** — rather than a free-entry number
     field.
   - **Alignment mode**: 9 defensive positions (3 outfielders) or 10
     defensive positions (4 outfielders). This sets the *maximum* number
     of outfielders; the actual number used also depends on attendance —
     see HR-7 in §6.1, which fills the 6 infield/battery positions first
     and reduces the outfield count (not the infield count) when fewer
     players are present than the mode calls for.
   - **Pitcher inning limit**: a checkbox toggling whether pitchers are
     limited to 1 inning per game (checked) or may pitch up to 2 innings
     (unchecked) — see HR-9 in §6.1.
3. **"Assign Positions"** — the single primary action. Enabled once at
   least 7 players are checked present (HR-7). Tapping it runs the
   auto-suggest generator (§6, §6.3) once, end to end, for every inning of
   the game, and switches the page to the result state (§3). There is no
   intermediate manual-assignment step — generation *is* the feature.
4. **Result tables** — the result state shows two tables, and nothing
   else needs building or editing by hand:
   - **Assignment grid**: rows are positions, columns are innings (or vice
     versa), each cell the assigned player's name — the full inning-by-
     inning lineup at a glance.
   - **Player summary**: one row per present player, with columns for
     innings played at **Pitcher, Catcher, Infield (1B/2B/3B/SS),
     Outfield, and Bench** — five mutually-exclusive counts that add up to
     the game's inning count, so the coach can sanity-check playing time
     at a glance. (Note this summary's "Infield" column is narrower than
     the `infield` *rule* category in §4/§6.1, which folds Pitcher and
     Catcher in with it for HR-2/HR-5/HR-6 purposes — the summary table
     breaks those two out separately because that's more useful to read at
     a glance.)
   Both tables are visible at the same time, on the same screen, with no
   navigation between them.
5. **Rule check** — a short, informational list of any hard-rule
   violations (§6.1) and soft-rule notices (§6.2) the generated alignment
   still has, shown below the tables. It's informational only: there is no
   manual-edit path to resolve a violation, so the expected response to
   seeing one is to tap **Regenerate** (§3) for a different alignment, not
   to fix it by hand.
6. **Regenerate / Start Over** — Regenerate re-runs generation with a new
   random alignment (§6.3) without touching attendance or options; Start
   Over clears the result and returns to the input state so attendance can
   be rechecked for a different game. Printing (browser print) works
   directly on the result state's tables and is the only way to take a
   result out of the app — there is no save/export/import of data files;
   all data is in-memory for the current session only.

Deferred / stretch (candidates, not committed):
- Multi-team support in one browser profile.
- Season-level tracking of cumulative playing time/positions across games.
- Printable PDF export.
- Persistence (localStorage/export-import) if a coach later wants to
  resume a session or keep season history — explicitly out of scope for
  now.
- Further configurable position sets beyond the 9/10-position modes (e.g.
  different rules for other league sizes like 6U tee-ball vs. majors).
- A manual override/edit path for the generated alignment — explicitly
  out of scope: the whole point of this tool is to remove manual
  assignment, so if that need resurfaces it should be reconsidered
  deliberately, not added back by default.

## 6. Rules/Criteria Engine

The tracked hard rules (§6.1) and soft preferences (§6.2) are the actual
criteria the generator (§5.3, §6.3) must satisfy — there's no separate
manual-assignment path that could otherwise take over when a rule is
tricky to satisfy automatically (§1), so the rules engine and the
generator are held to a higher bar than a typical "nice to have"
auto-suggest: the generator needs to get this right on its own. The engine
still stays isolated and pluggable so new criteria can be added as one
rule module without touching the UI:

- Each rule is a small module with a consistent shape: `id`, `label`, and
  `validate(game) -> Violation[]` (see `src/rules/hr1.js` etc.).
- Rules are registered in one list (`src/rules/index.js`), so adding a new
  rule from the tracked lists (§6.1, §6.2) means adding one file plus one
  registration line — no changes to UI or state code.
- The generator (§6.3) is a greedy heuristic that reads the same rule
  definitions (specifically the `infield`/`outfield` position categories
  from §4) to decide its scoring, rather than hardcoding any of this
  league's specific numbers inline — so a new rule that changes those
  categories or minimums doesn't require touching the generator's control
  flow, only its scoring inputs.
- New criteria are added by appending to §6.1/§6.2, writing one rule
  module, and updating the generator's scoring/ordering to account for it
  — the plan is the running source of truth for *what* the rules are;
  `src/rules/` and `src/suggest/autoSuggest.js` are where they're enforced
  and optimized for, respectively.

### 6.1 Hard Rules (tracked list)

Hard rules are constraints that must never be violated in a valid
alignment — the rules engine should block/flag any assignment that breaks
one (not just warn). This list is the running source of truth for those
rules as they're provided; each entry should become one rule module under
`src/rules/` (see §7) once implementation starts.

| # | Rule |
|---|------|
| HR-1 | A player who plays catcher for more than 3 innings in a game cannot also pitch in that same game. |
| HR-2 | Every player must play at least one inning of infield and at least one inning of outfield in every game. |
| HR-3 | No player may play outfield for 3 consecutive innings. Innings spent on the bench are excluded when determining "consecutive" — i.e. bench innings don't break an outfield streak, so e.g. outfield → outfield → bench → outfield still counts as 3 consecutive outfield innings and is not allowed. |
| HR-4 | No player may be benched for a second inning until every present player has been benched at least once in that game (i.e. bench turns must round-robin through the full present roster before anyone repeats). |
| HR-5 | Every player must play at least one inning of infield within the first 3 innings of the game. |
| HR-6 | Every player must play a minimum of 2 innings in the infield in a game. |
| HR-7 | A game requires a minimum of 7 present players to be played. When fewer players are present than the chosen alignment mode's full complement (9 or 10), the 6 infield/battery positions (Catcher, Pitcher, 1B, 2B, 3B, SS) must still all be filled every inning, and the shortfall is absorbed by fielding fewer outfielders (down to a minimum of 1) rather than leaving an infield/battery position empty. |
| HR-8 | Every present player must play a defensive position (any position, not bench) for at least 2 full innings in the game. |
| HR-9 | A player may pitch at most 1 inning per game if the game's "Pitcher inning limit" setting is on, or at most 2 innings per game if it's off (see Game setup, §5). This is a per-game configurable limit, not a fixed constant — the rules engine reads the max from the game's setting rather than hardcoding it. |
| HR-10 | Once a player is moved off the pitcher position, they cannot pitch again later in the same game — even if they haven't yet reached the HR-9 innings limit. A player's pitching innings must be one uninterrupted stint at pitcher; there's no returning to pitch after being pulled. |

For HR-2, HR-5, and HR-6, "infield" means the positions **Catcher,
Pitcher, 1B, 2B, 3B, and SS** — i.e. the `infield` position category from
§4 (Core Domain Model), which by league convention includes the battery
positions, not just the four infield dirt positions.

As more hard rules are provided, add them here (numbered HR-7, HR-8, ...)
before turning them into code, so the full set of constraints stays visible
in one place independent of the implementation.

### 6.2 Soft Rules (preferences, tracked list)

Soft rules are preferences the generator should optimize for and the UI
may surface as non-blocking notices — unlike hard rules (§6.1), violating
one is never treated as an error, and since there's no manual-edit path
(§1, §5), the only way to try for a better outcome on one is to tap
Regenerate (§6.3).

| # | Preference |
|---|------|
| SR-1 | A player should not be assigned to the same specific position twice in a game, unless it's unavoidable given the roster size, attendance, and the hard rules. Auto-suggest should maximize position variety per player before repeating; a repeat that auto-suggest could not avoid is not flagged as a problem. |
| SR-2 | A player's innings should be balanced between infield and outfield as much as possible, not just the HR-2/HR-6 minimums (at least 1 outfield inning, at least 2 infield innings) — e.g. a player with 6 innings on the field should end up close to an even infield/outfield split rather than, say, 5 infield and 1 outfield, when the roster and other rules allow it. |

As more soft preferences are identified, add them here the same way hard
rules are tracked in §6.1, and note in §7/§8 which module implements each
one (soft rules mainly influence `src/suggest/autoSuggest.js`'s scoring
rather than `src/rules/`'s pass/fail checks, though a soft rule may still
get its own informational — never blocking — entry in the rules engine).

### 6.3 Generator Randomization

Since there's no manual-assignment fallback (§1, §5), the coach's only
lever over the *result* — as opposed to the game options — is
**Regenerate**, so the generator must actually produce a different
alignment each time it's run with the same attendance and options, not
the same one every time. Concretely:

- The generator shuffles its internal rotation order (who's first in line
  for bench, pitcher, infield, outfield, etc.) using a random shuffle
  each time it runs, seeded from nothing persistent (no fixed seed) — so
  "Assign Positions" and every subsequent "Regenerate" tap draws a fresh
  random order and, in general, produces a different valid alignment.
- Randomization only changes *which* valid alignment is chosen among the
  ones that satisfy the hard rules (§6.1) and score well on the soft
  preferences (§6.2) — it never trades away rule compliance for variety.
- This is a property to keep, not a one-time fix: any future change to
  the generator's internals should preserve "the same inputs can still
  produce a different alignment on Regenerate," since that's the coach's
  only recourse for an alignment they don't like.

## 7. Suggested File Structure

```
/
├── index.html              # app shell, loads main module
├── docs/
│   └── plan.md
├── src/
│   ├── main.js              # bootstraps app; renders the input state or
│   │   the result state onto the one page — no router/page state
│   ├── models/               # Player, Team, Game, Inning, Position defs
│   ├── data/
│   │   └── roster.js          # embedded season roster — edit for new season
│   ├── state/                # in-memory store (session-only, no persistence)
│   ├── rules/
│   │   ├── index.js           # registered hard + soft rule lists
│   │   └── ...rule modules
│   ├── suggest/               # the generator (autoSuggest.js) — the only
│   │   path to an alignment; see §6.3 for its randomization requirement
│   ├── views/                 # setupView (input state: attendance +
│   │   options + Assign Positions) and resultsView (result state: the
│   │   two tables, rule check, Regenerate/Start Over) — no alignment/
│   │   field-diagram view, since there's nothing to hand-edit
│   └── styles/
│       ├── base.css           # resets, tokens, typography
│       ├── layout.css         # mobile-first layout & breakpoints
│       └── components.css
└── tests/                    # unit tests for models + rules engine
```

## 8. Development Phases

1. **Scaffold** — static shell, mobile-first CSS baseline, the input state
   and result state stubbed out (§3), no real data logic yet and no router.
2. **Data layer** — domain model, in-memory store.
3. **Rules engine** — implement the hard/soft rule modules from §6.1/§6.2.
4. **Generator v1** — the auto-suggest algorithm (§6.3) that takes
   attendance + options straight to a complete, rule-satisfying alignment;
   since there's no manual-assignment UI to fall back on, this needs to be
   solid before anything else is worth polishing.
5. **Result tables** — the assignment grid and player summary (§5.4), plus
   the rule-check panel (§5.5) and Regenerate/Start Over (§5.6).
6. **Polish** — print styling, offline support, accessibility pass,
   cross-device testing on real phones.

## 9. Testing Approach

- Unit tests for the domain model and rules engine (pure functions, easy to
  test without a browser — plan to use a lightweight test runner that runs
  under Node for these, e.g. `node:test`).
- Generator tests cover both (a) that a generated alignment satisfies the
  hard rules for representative roster sizes/options, and (b) that
  randomization (§6.3) is actually working — e.g. running the generator
  many times on the same inputs and asserting the results aren't all
  identical, rather than asserting any single exact output (which would be
  flaky/over-fitted to one random draw).
- Manual mobile testing on at least one real phone-sized viewport (Chrome
  DevTools device emulation plus one physical device) at each phase.
- No automated end-to-end browser testing planned initially, given the
  small surface area; revisit if the app grows complex interaction flows.

## 10. Deployment

- Host as static files on GitHub Pages (or equivalent static host) directly
  from this repo — no build/publish pipeline required if we avoid a bundler;
  if a bundler is later adopted for convenience, add a simple CI step that
  builds `dist/` and deploys that.

## 11. Open Questions — to resolve when criteria are provided

- What are the exact hard constraints (must never be violated) vs. soft
  preferences (informational only, per §5.5/§6.2)?
- Baseball vs. softball vs. both — any rule or position-set differences?
- What playing-time/position-variety rules apply (e.g. league mandates
  minimum innings, no repeat position two games in a row, pitch-count
  limits)?
- Do we need season-level history (across multiple games) to satisfy any
  rule, or is each game self-contained?
- Any safety-driven limits (e.g. max innings catching/pitching per game or
  week) that require tracking beyond a single game?
- Number of innings per game and roster size ranges the tool must support
  (affects UI density and auto-suggest complexity).
