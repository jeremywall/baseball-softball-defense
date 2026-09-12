# Future Ideas

Brainstormed feature upgrades for the defensive alignment planner —
**not committed, not scheduled**. Nothing here overrides `docs/plan.md`;
anything adopted from this list should get folded into the actual plan
(and its own tracked rule numbers, if applicable) before being built.
Ideas are grouped loosely by theme.

## Better generated alignments

- **Multiple options at once.** Instead of one alignment plus a
  Regenerate button, generate 2-3 candidate alignments side by side (or
  swipeable on phone) and let the coach pick a favorite. Same one-button
  philosophy, just three outputs instead of one per tap.
- **A visible fairness score.** Alongside the Rule Check panel, show a
  single at-a-glance number or bar (e.g. "playing time spread: tight" vs.
  "wide") summarizing how evenly infield/outfield/bench time landed
  across players this run, so a coach can decide whether Regenerate is
  worth tapping without reading every row of the summary table.
- **Lightweight "lock" constraints.** Not full manual assignment (that's
  deliberately out of scope, per `docs/plan.md` §1/§5) — but a small,
  optional set of pre-generation constraints like "Ben pitches this game"
  or "Ava doesn't play catcher today," which the generator then treats as
  additional hard constraints alongside HR-1..HR-10. Keeps the one-button
  workflow while covering the "I already know one thing" case.
- **Skill/eligibility flags per player.** Simple per-player tags (e.g.
  "not ready to pitch yet," "strong arm," "new to catcher") that feed the
  generator's scoring, building on the `attributes` bag already sketched
  in the domain model (`docs/plan.md` §4) but never wired up to anything.

## Beyond one game

- **Multi-game / doubleheader flow.** After finishing one game's result,
  offer "New game, same attendance" so a coach doesn't re-check 12 boxes
  for game 2 of a doubleheader — keeps attendance, regenerates fresh
  innings/options.
- **Optional season history via file, not auto-persistence.** Still no
  silent localStorage (`docs/plan.md` §2 is a deliberate constraint) —
  but an explicit "Export season stats" / "Import season stats" JSON file
  a coach opts into, so cumulative innings-by-position across games could
  inform fairness over a season, not just one game at a time.
- **Practice/scrimmage mode.** A relaxed preset (shorter "innings," fewer
  or no hard rules enforced) for informal practice reps, distinct from
  the real-game rule set.

## Sharing the result

- **"Copy as text" for group texts/GroupMe.** A plain-text rendering of
  the lineup (one line per inning or per player) copied to the clipboard,
  for pasting into a team group chat without a screenshot.
- **QR code linking to the result.** Since there's no server, this would
  need to encode the lineup into the URL itself (or a same-device share
  sheet) rather than a hosted link — worth scoping carefully against the
  "no server, no persistence" constraints before committing to it.
- **High-contrast / large-text mode.** A one-tap toggle for outdoor
  sun-glare readability at the field, beyond the existing light/dark
  `prefers-color-scheme` support.

## League flexibility

- **Configurable rule packs.** Today HR-1..HR-10 are one specific
  league's rules, hardcoded. A future version could support swapping in
  a different named rule set (different league, different age division)
  without editing code — e.g. a rule-pack picker next to the roster file,
  each pack being its own small set of rule modules.
- **Baseball vs. softball naming.** Optional terminology swap (e.g. the
  10th fielder as "Rover" or "Short Fielder" instead of LC/RC) — cosmetic
  but matters for how familiar the result reads to a given league.

## Explicitly reconsider before building

- Anything that reintroduces manual position editing — that's a
  deliberate non-goal (`docs/plan.md` §5 "Deferred/stretch"), so even a
  "small" manual tweak feature should be a real conversation, not a quiet
  add-on.
- Multi-team/multi-coach accounts — meaningfully changes the "no
  persistence, single session" architecture and probably isn't worth it
  unless several coaches actually ask for it.
