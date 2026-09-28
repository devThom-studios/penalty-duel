# Penalty Duel

A two-player penalty shootout. Create a room, invite a friend using the six-character code, and alternate between striker and goalkeeper.


## Exhibition teams

Both players choose a club or national team in the lobby, pick a preferred home or away kit, and press Ready before the host starts. The catalog contains 92 teams across Africa, Europe, Asia, North America, South America and Oceania, using geographic regions and classic team-inspired colours. All teams have identical gameplay abilities. There are no official badges, season-specific kit replicas or licensed player likenesses.

The team picker opens automatically on either device when that player has not chosen a team. Each player also has a visible Choose/Change your team button. Match controls include six labeled direction buttons independently of stadium rendering. Versioned API responses refresh an older connected client after a future publication while preserving the room session.

Selections synchronize across devices. The server validates the team and kit, locks them during play, and resets readiness when a selection changes. A rematch keeps the teams; Change teams returns both players to the selection lobby. Existing room records gain the new selection fields when loaded, without a schema change.

Player shirts, shorts, socks and trim follow their team as striker and keeper roles switch. Colour clashes automatically select a contrasting kit for the second side. Each goalkeeper has a distinct jersey colour, chosen against both field kits and the other keeper.

## Rules and controls

- Five penalties each, with early victory when the opponent cannot catch up.
- Ties go to paired sudden-death penalties; both players always get a kick in each pair.
- The striker selects one of six goal zones, holds Shoot (or Space), and releases for power.
- The keeper secretly chooses a zone and locks the dive. A matching zone saves the shot.
- Above 97% power misses over the bar. Below 35% is easier to save from an adjacent column. The green band marks the recommended power range.
- Choices remain private until both players lock them. Server responses include only the viewer's own choice during aiming.
- Goal animations play together, then roles switch automatically. Both players must request a rematch to restart.
- Use touch/click on targets, or keys 1–6. Space shoots or locks the keeper's dive.

## Match record

Each room keeps a server-owned win total for each player; a player's losses equal the other player's wins. The record appears above the score and updates once when a shootout finishes. Repeated syncs, refreshing and requesting a rematch never count the same match twice. Totals survive rematches and team changes for the same two players. A new room starts at zero; leaving or room expiry ends that record. Existing rooms initialize their record automatically and count a currently finished shootout once.

## Stadium audio

A looping human crowd chant plays during aiming and penalties. At ball contact there is a short kick effect; when the result appears, a goal triggers cheers and a save or miss triggers a disappointed crowd. Reactions briefly lower the background chant. Generated stereo MP3s are bundled in `public/audio/`, so gameplay does not depend on a third-party audio server.

Sound unlocks on a completed tap/click or keypress, respecting mobile autoplay restrictions. Every new tap retries playback even if an earlier browser resume promise is still pending. Explicitly enabling it before the match plays a one-second crowd preview; the button shows a loading or retry state when needed. The labeled speaker control toggles sound and remembers this device's preference. Muting, hiding the tab, leaving or a connection pause stops active sounds. Old reactions are not replayed on reconnection; rematches have their own cue IDs. Audio failures never block gameplay.

## Implementation

Vinext/React, Three.js and Cloudflare D1. WebGL renders the stadium and animated players; a software SVG renderer supports browsers without WebGL. Room tokens authorize each seat. Conditional revision updates prevent concurrent requests from overwriting choices or double-counting goals. The server owns scores, outcomes, transitions and match completion. Clients only animate the authoritative result.

Rooms expire after two inactive hours. Session-scoped credentials allow returning to the same seat after reloading. Disconnected games pause; leaving ends the room for both players.

The original football room table and migration are retained without destructive changes. New shootouts use `penalty_rooms` and `/api/penalty`.

## Checks

- `node node_modules/typescript/bin/tsc --noEmit`
- `node --experimental-strip-types tests/penalty.test.mjs`

D1 schema is in `db/schema.ts`; generated migrations are in `drizzle/`. The platform provisions the `DB` binding and applies migrations on publication.

The Arena display font is Nimbus Sans Narrow Bold, licensed in `public/fonts/LICENSE.txt`.
