# Prompt: a cozy multiplayer hangout game (Cloudflare Workers)

Paste everything below the line into Claude Code in an empty folder (or a new repo).

---

Build **Hillside Hangout**: a cozy browser game where friends drop into a little toon world together as chibi animals, walk around, chat, emote, sit on benches, play small shared games, and just hang out. There is no goal and no way to lose. It should feel like a warm afternoon in a tiny village. Multiplayer runs on **Cloudflare Workers + Durable Objects**, and the same Worker also serves the game.

Before you write any code, ask me up to 6 short questions about anything that would change the design (for example: how many players per room, first or third person, which activities matter most). Then propose a short plan and build it.

## Look and feel (match this style exactly)

- **Three.js 0.160** loaded from a CDN with an import map; plain ES modules and static files, with no bundler and no framework.
- **Toon shading:** `MeshToonMaterial` with a 4-step gradient whose darkest step stays warm and light. Use one warm sun plus a hemisphere light, and bake the sun's shadow map once because the world is static.
- **Ink outlines:** inverted-hull outlines in chocolate brown `#4B2E1D` (never black). Push them out in screen space with smoothed normals so hard edges don't gap. Lines thin gently with distance.
- **Shapes:** chunky, soft and rounded, like vinyl toys or clay miniatures. Build from rounded boxes, capsules and lathe shapes with squat proportions; nothing thin or sharp.
- **Palette:** cream `#F8E8C8` and `#FFF3DC`, apricot `#F4A646`, pumpkin `#E8893A`, soft pink `#F7B9C4`, sage `#AFCB9C`, powder blue `#AFD6EC`, butter `#FFE08A`, and honey wood. No cold greys.
- **Characters:** chibi cats, bunnies, bears, puppies and foxes with big heads, dot eyes, blush, little paws and a soft blob shadow. They walk with a bouncy waddle and blink.
- **Effects:** additive glow sprites on lamps, puff clouds, hearts, sparkles, floating notes, dust motes in sunbeams, and fireflies at night.
- **UI:** a rounded "Fredoka" font from Google Fonts. Cream pill buttons with thick brown borders and a hard drop shadow, orange for primary actions. Speech bubbles with tails float over heads.
- **No clipping, ever:** things rest exactly on surfaces, nothing pokes through anything, and the far-away title camera uses a tight near/far range so nothing z-fights.
- Merge static meshes by material to keep draw calls in the low hundreds. Lower the pixel ratio automatically on slow devices.

## The world

One hand-made map of about 40 × 40 m, a hillside village square seen from a **third-person follow camera** (orbit with the mouse or a drag, zoom with the wheel or a pinch). It contains:

- A cobbled plaza with a fountain, string lights and benches.
- A tiny café with a counter and stools, where you can grab a drink prop (a mug or a milkshake) to hold.
- A pond with a little dock (fishing spot), lily pads and ducks paddling in loops.
- A park with a swing set, a seesaw and a picnic blanket.
- A stage with a piano, drums and a xylophone for jamming together.
- A campfire ring with log seats, and a hilltop lookout with a telescope.
- Painted hills, trees and little houses around the edge, with a soft invisible wall so you can't leave.

Add **ambient life:** butterflies, ducks, a sleeping cat, smoke from chimneys, and swaying grass.

There is also a **day/night cycle** (about 20 minutes per day) that is the same for everyone in a room: the room tells each client the time. The sky, light colour, lamps, fireflies and stars change through the day.

## Players

- **Character creator** before joining: animal, fur colour, outfit colour, and up to two accessories (beret, bow tie, scarf, flower crown, glasses, backpack). Save it in `localStorage` together with the name.
- **Moving:** WASD or arrows to walk, Shift to run, Space to hop. On phones: a left joystick, drag to orbit, and a jump button.
- **Name tags** float over everyone.
- **Emotes** on a wheel (Q, or a button): wave, dance, clap, laugh, sit on the ground, heart, sleep (z's), and cheer. Each has a little animation plus an effect.
- **Sit** on any bench, stool or log with E. Snap to the seat and face the right way. Others see it.
- **Hold a prop** from the café or the picnic basket. Others see it in your paws.
- **Chat:** Enter to type, Enter to send, Esc to close. Messages appear as speech bubbles over the speaker and in a fading log in the corner. Escape all text and limit it to 140 characters.
- **Ping:** G puts a marker on the spot you're looking at.

## Shared activities (synced for everyone in the room)

- **Music jam:** walk up to an instrument and press E to play notes with keys 1–8 or on-screen pads. Everyone hears the notes with the right instrument sound, synthesized with WebAudio and quantized lightly so it sounds nice together.
- **Ball:** a big beach ball in the park that anyone can kick. Its physics run in one place (see networking) and everyone sees the same ball.
- **Fishing:** cast at the dock and press when the bobber dips. Catches go into a little collection book that is saved locally.
- **Campfire:** anyone can light it. Toast a marshmallow with a timing mini-game, then show it off.
- **Swing / seesaw:** sit and press to swing. Two players on the seesaw bob each other.

## Multiplayer architecture (Cloudflare)

- **One Worker** (`server/worker.js`) serves the static game through an `ASSETS` binding (put a `.assetsignore` in the project root that excludes `server`, `wrangler.toml`, `.git` and `.wrangler`). It routes WebSocket upgrades on `/room/CODE` to a **Durable Object `Room`**, one per room code. It also answers `/health` with `{ ok: true }`.
- **The Durable Object:**
  - Use the **WebSocket Hibernation API** (`ctx.acceptWebSocket`, `serializeAttachment`) and SQLite-backed storage (`new_sqlite_classes` in the migration).
  - Hold a roster of up to 8 players: id, name, avatar, current position and pose.
  - On join, send the newcomer a welcome message with the roster, the room's clock and the shared-object state.
  - Tell everyone about joins and leaves.
  - Relay movement at about 10–12 Hz.
  - Own the shared state: the ball, the campfire, who is sitting where, and the instrument notes. The server is the referee for seats ("someone's already there"). The ball is simulated by the player who last touched it and corrected by the server.
- **Messages** are small JSON with a type field (`hello`, `roster`, `join`, `leave`, `move`, `emote`, `chat`, `sit`, `note`, `ball`, `fire`, `ping`).
  - Clamp and validate everything server-side: names 16 characters, chat 140, sane positions, and rate limits per socket.
  - A socket that's turned away (room full) must not broadcast a "left" message.
- **Clients:**
  - Keep a stable client id in `localStorage`, so a reconnect replaces the old socket instead of creating a ghost.
  - Reconnect with backoff.
  - Interpolate other players between updates (about 100 ms behind) and smooth their turning.
  - Predict your own movement locally.
- **Rooms:** create a room (a 4-letter code with no 0/O/1/I) or join one. There's a "copy invite link" button (`#room=CODE`). Opening an invite link joins automatically. A small lobby panel shows who's here, and there's a "Leave room" option on the pause card.
- **Server address:** if the page isn't served by the Worker (for example from GitHub Pages), let me paste a server address, and keep a `DEFAULT_SERVER` constant I can fill in.
- **Solo fallback:** with no server you can still walk around the world alone.

## Files

- `index.html`: page, HUD, lobby, character creator, chat, styles
- `src/main.js`: loop, camera, input, players
- `src/world.js`: the map
- `src/characters.js`: animals, accessories, emote animations
- `src/toon.js`: materials, outlines, geometry helpers
- `src/net.js`: connection, lobby, chat
- `src/sync.js`: interpolation, shared objects
- `src/activities/*.js`: one file per activity
- `src/audio.js`: WebAudio instruments and sounds
- `server/worker.js`: the Worker and the Room
- `wrangler.toml`, `README.md`, `PROMPT.md`

`PROMPT.md` should be an improved version of this prompt describing what you actually built.

## Testing (do this, don't just say it works)

- Run the Worker locally with `npx wrangler dev --persist-to /tmp/hangout-rooms`. Keeping the state folder outside the project stops the dev server reloading itself in a loop.
- Drive **two or three headless browser pages** with Playwright against it. Use separate browser contexts so each gets its own client id.
- Check:
  - joining by code and by invite link
  - everyone sees everyone move
  - chat both ways
  - an emote and a sit show for the other players
  - the room-full message
  - a player reloading and coming back as the same player
  - the ball staying in sync
  - the campfire state for a late joiner
- Take screenshots of the plaza at day and night, the character creator, the lobby, and a phone-sized layout. Look at them and fix anything that clips, floats, overlaps or reads badly.

## Deploy

Finish with a README section that walks me through deploying from scratch **on macOS**:
1. Install Node LTS from nodejs.org.
2. Get the code.
3. Run `npx wrangler login`.
4. Run `npx wrangler deploy`.
5. Register a workers.dev subdomain if it asks.
6. Check `/health`.
7. Share the invite link.

Also explain how to update later with `git pull` and `npx wrangler deploy`. The free Workers plan must be enough.

## Working style

- Build in this order: the world and one player → the character creator → rooms and movement sync → chat and emotes → sitting and props → the shared activities → day/night → polish.
- Commit after each working step with a clear message.
- Keep code readable: match the existing style, keep comments short and only where they help, and don't over-engineer.
- When you finish, tell me plainly what works, what you tested and how, and anything that's rough or untested.
