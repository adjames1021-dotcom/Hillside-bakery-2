# Hillside Bakery

A cozy first-person baking game in a toon bakery. You're a little fox baker running a shop day by day: take orders from chibi cat, bunny, bear and puppy customers, gather and prep ingredients from **Dry Storage** and **Cold Storage**, work each recipe card step by step at the kitchen stations and the center **prep island**, then serve the finished dessert at their table. After closing, spend your coins at the **morning market** on restocks, kitchen upgrades and decor.

Pick a kitchen on the title screen: the **Hillside Bakery**, or **Lantern Cliff**, a fancy seaside restaurant where waiters take the orders and carry your plates out to the tables. Play alone, or with a friend in **two-chef co-op** (see [Co-op](#co-op-with-a-friend)).

The full design brief is in [PROMPT.md](PROMPT.md).

## Play

The game is static files (ES modules plus Three.js from a CDN), so serve the folder over HTTP:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

| Action | Keyboard / mouse | Touch |
| --- | --- | --- |
| Look | Mouse (click to lock the pointer) | Drag the screen |
| Walk | WASD / arrow keys | Left joystick |
| Use (take order, grab, place, serve) | E, Space or click | **Use** button |
| Pick a ticket | 1–4 or click it | Tap a ticket |
| Recipe book | R | **Recipes** button |
| Morning market (before opening) | B | **Market** button |
| Left / right (lattice, crisscross) | A / D or arrow keys | **Left** / **Right** |
| Pick a layer | 1–9 | Tap the layer |
| Step back from a station | Q | **Step back** |
| Ping a spot for your co-op partner | G | |
| Throw what you're holding to your partner | T, or look at them and press E | **Throw** button |
| Chat (co-op) | Enter, type, Enter | **Chat** button |

## A day at the bakery

1. **Morning (8 AM).** The sign on the front door says Closed. Check today's **special** (it pays extra), visit the market with B if you like, then flip the sign to open. The shop also opens by itself at 9.
2. **Open hours (9 AM to 5 PM, about six and a half minutes).** Customers arrive through the door. Last orders are at 4:30.
3. **Closing time.** Finish the last orders. The day summary shows treats served, coins, tips, average stars and the crowd favourite.
4. **Morning market.** Restock the pantry (every grab uses one ingredient from the shelf), buy upgrades such as a Speedy Oven, Oven Thermometer, Stand Mixer, Sharp Knife, Copper Pot, Frosty Freezer, Comfy Cushions, Tip Jar or Bigger Shelves, and buy decor that shows up in the shop: sunflowers, paper lanterns, hanging ferns, a specials chalkboard and a shop cat.

New menu sections join on later days: Pies and Cookies on day 1, Pastries on day 2, Cakes on day 3, Cold & Frozen on day 4, Candy & Campfire on day 5. Coins, stock, upgrades and decor are saved in the browser.

## Lantern Cliff, the restaurant

An open kitchen high on a sea cliff at sunset, with a lighthouse, slowly drifting sailboats, a jetty far below and lanterns outside the glass walls. The kitchen is a pro one: a stainless prep counter with a white poly board and hotel pans of mise en place, and a plating pass under heat lamps where tweezers, a pepper mill, a microplane, a sifter and squeeze bottles do the garnishing. Dishes are plated on navy-banded fine-dining plates and served onto place settings with a gold charger, cutlery, a napkin and a wine glass; guests eat the food and leave the plate. Guests come in through the door, a waiter (Pierre or Lulu, plus Basil if you hire him) takes their order at the table and walks the ticket back to **the pass**. You cook from the Pantry and the Cold Room, then set the finished plate on the pass and a waiter carries it out. The menu has 21 dishes: Starters & Soups and Pasta & Risotto on day 1, From the Sea on day 2, From the Grill on day 3, Desserts on day 4, and Chef's Signatures on day 5. It has its own market: a Stone Hearth Oven, Probe Thermometer, Pro Blender, Japanese Knife Set, Copper Cookware, Turbo Chiller, Third Waiter, Quick Runners, Velvet Chairs, a Maître d' (tips) and a Walk-in Pantry, plus table candles, roses, a grand piano, a chef's menu board and a crystal chandelier. Each kitchen keeps its own save.

## Co-op with a friend

Two chefs share one kitchen over the internet. On the title screen, press **Co-op with a friend**, type a name and **Create a room**. Send your friend the four-letter room code (or the invite link); they press **Co-op with a friend**, type the code and **Join**.

In the lobby the host picks:

- **The kitchen:** Hillside Bakery or Lantern Cliff. Switching reloads both players into the new kitchen and they rejoin the room automatically.
- **Difficulty:** a slider from Cozy to Frantic. It sets how patient the guests are, how fast they arrive, how many come at once, how hard the rush hits, how much a walkout costs and how well the day pays (Busy pays 20% more, Frantic 40%).

Then **Start the day together**. The day works like a busy service:

- It starts calm and gets busier through the day. Three **rush waves** (lunch, afternoon and a final rush; sunset and dinner at Lantern Cliff) come with a big banner, a burst of guests, shorter patience and more two-dish orders. The **rush meter** on the right, under the top bar, shows Calm, Busy, Rush! or Frantic!.
- Serve guests in a row to build a team **streak** (up to ×1.4 coins). A guest who gives up and leaves breaks the streak and costs the team coins.
- Only one chef can work a station's close-up at a time. Your partner is a fox with a name tag, and you can see what they're carrying. Press **G** to ping the spot you're looking at.
- **Throw** what you're holding (a bowl of ingredients, a finished plate) to your partner: look at them and press E, or press T from up to 8 m away. It arcs through the air into their paws, as long as their paws are empty and they aren't busy at a station.
- **Chat** in the lobby, and in the kitchen with Enter (or the Chat button). Messages show in the corner and in a bubble over the other chef.
- **Tickets:** your selected ticket and your partner's both show their full recipe, with your partner's name on theirs, and the ▸ button keeps any other ticket open too. Tickets say whose paws an order is in.
- The kitchen keeps running when either chef pauses. The day summary adds a team rating (1–3 stars).
- The host runs the morning market and keeps the progress (coins, day, upgrades) in their save.

### Running the co-op server (Cloudflare Workers)

Rooms run on a small Cloudflare Worker with a Durable Object per room (`server/worker.js`). The same Worker also serves the game, so the simplest setup is to deploy it and play from its address:

```sh
npx wrangler login
npx wrangler deploy
# then open https://hillside-bakery.<your-subdomain>.workers.dev
```

The free Workers plan is enough for this. To try it locally, run `npx wrangler dev --persist-to /tmp/hillside-rooms` and open http://localhost:8787 in two browser windows. Keeping the room state outside the project folder stops the dev server from reloading itself.

If you host the game files somewhere else (GitHub Pages, a claude.ai artifact, `python3 -m http.server`), open **Co-op server** in the lobby and paste your Worker's address, or set `DEFAULT_SERVER` in `src/net.js`. Invite links carry the address along.

How it works: the host's browser runs the kitchen (customers, timers, coins) and sends a snapshot of it about ten times a second. The guest's browser rebuilds the kitchen from those snapshots and sends its actions back for the host to carry out, so both always see the same tickets and plates. The guest plays station mini-games locally and reports the result. The Worker only relays messages and remembers the lobby (host, kitchen, difficulty).

## How a recipe works

1. A customer sits down with a **!** bubble. Look at them and press E to take the order. Tickets appear with the recipe card. Regulars sometimes order two treats, or make a **special request**: extra sprinkles, "make it pink", no nuts, extra toasty, or "in a hurry" (less patience, bigger payout). Follow the ticket, not the book.
2. **Gather** the listed ingredients. The ticket names each one, and it turns green once it's in the bowl. Some need prepping first (a little knife badge on the ticket): peel apples, crack eggs, pit cherries, hull strawberries, grate carrots, zest lemons, chop chocolate and so on. Take the bowl to the **Prep Island** to prep them.
3. Follow the card. Each step is a small hands-on game:

   | Game | How it plays | Examples |
   | --- | --- | --- |
   | Tap | One tap per stroke | chop, press a crust, knead |
   | Timing | Tap while the slider is in the green zone | crimp edges, cut rings, scoop dough balls, flip |
   | Pour to the line | Hold, then let go inside the band | fill liners, pour filling, dip in glaze |
   | Circles | Move the mouse or finger in circles, any size, either way | pipe a swirl, whisk, peel, roll in sugar |
   | Side to side | Sweep left and right, or tap A and D | fold, scatter crumble, drizzle glaze |
   | Left / right | Alternate sides | weave a lattice, fork crisscross |
   | Layers | Build the layers in order | banana pudding, layer cakes, s'mores |
   | Roll / hold | Move up and down, or hold | roll out dough, squeeze limes |

   - **Prep Island:** the tools do the work in front of you. The knife chops where the timing slider is, the rolling pin rolls under your mouse, the piping bag and spatula follow your circles, the pitcher tips while you hold, and a paw lays lattice strips. The treat builds up as you go: strips appear one by one, frosting grows, filling rises. While you prep ingredients, the bowl waits beside the board and each prepped pile hops into it.
   - **Mixing Bowl:** the stand mixer swaps between whisk, dough hook and paddle, and the bowl blends from the colours of what you gathered into the batter.
   - The close-up camera lines up square with each station (or with the island side you're standing at) and eases in, framing the work above the mini-game card.
   - **Oven:** the oven stays put while it works; the door drops open and the treat goes on a baking tray, where it puffs up as it bakes. Take it out while the gauge is golden, unless the customer asked for extra toasty. Toasty or burnt costs stars.
   - **Stove:** fillings simmer in an open pot you can see into, with bubbles that speed up when it needs a stir. Donuts and fritters fry in the pan and need flipping, and s'mores marshmallows toast on a skewer and need turning. Miss the call and it scorches.
   - **Freezer:** a lift tray lowers the treat in and brings it back up when it's set.
   - **Decorating Table:** add the toppings from the ticket, in order. Each one's tool hops over the treat (the shaker shakes, the bottles drizzle, the bag pipes) and the topping lands on it.
4. Serve it for coins, hearts and a 1–3 star rating. Stations keep working on their own, so you can juggle orders, and the island has two spots for setting things down.

## Look and tech

- `MeshToonMaterial` with a 4-step gradient; one warm sun and a hemisphere light, plus warm pendant point lights; the shadow map is baked once.
- Inverted-hull outlines in `#4B2E1D`, pushed out in screen space with smoothed normals, thinning with distance in first person. A butter-yellow highlight hull marks what the crosshair is on.
- `RoundedBoxGeometry` and rounded lathe shapes, and procedural 3D clay-miniature desserts (`src/dessert3d.js`) with unbaked, plain, toasty and decorated variants. Frosting is a star-tip piped swirl, pies have fluted tins, pinched crusts and a woven over-under lattice, liners are pleated, cookies have hand-made wobbly edges, and fruit uses real lathe silhouettes (dimpled apples, pointed lemons, curved bananas, seeded strawberries, ribbed pumpkins).
- Flat canvas textures with world-space UVs, a shared hand-lettered label atlas, additive glow sprites, dust motes, and a painted hillside seen through real window openings.
- Treats are scaled to fit the pan, tray, board or stand they sit on, and the paws cradle what you carry from below, so nothing pokes through anything. Labels curve around jars and sacks, and the title camera uses a tight depth range so the far-away diorama doesn't flicker.
- Static meshes are merged by material (a few hundred draw calls). The pixel ratio drops automatically on slow devices.
- The title screen is the original isometric cutaway diorama, and the camera swoops into the baker's eyes.

## Files

- `index.html`: page, HUD, tickets, mini-game card, recipe book and styles
- `src/main.js`: game loop, first-person camera, targeting, orders, stations, the shop day, customers, waiters, the co-op rush
- `src/venue.js`: which kitchen you're in (bakery or restaurant) and the words that differ
- `src/restaurant.js`, `src/rest_data.js`, `src/rest3d.js`: Lantern Cliff's world, menu, ingredients, upgrades and 3D dishes
- `src/net.js`: co-op lobby, room connection and difficulty settings
- `src/coop.js`: co-op sync: host snapshots, the guest's mirror of the kitchen, the partner's avatar and pings
- `server/worker.js`, `wrangler.toml`: the Cloudflare Worker and Durable Object that host co-op rooms
- `src/minigames.js`: the station mini-games (tap, timing, pour, circles, side to side, left/right, layers, roll, hold); circles are tracked around a center that trails the pointer, so any size or direction counts
- `src/shop.js`, `src/shopIcons.js`: day summary, morning market, prices, upgrades and decor icons
- `src/decor.js`: buyable decor pieces and the Open/Closed door sign
- `src/world.js`: the room, stations, island, Dry and Cold Storage, café, lighting
- `src/props.js`: reusable furniture and flat textures
- `src/desserts.js`: the 50 desserts, recipe cards, toppings and sticker art
- `src/ingredients.js`: 33 ingredients with stickers, 3D models and the label atlas
- `src/tools.js`: the kitchen tools used at the stations (chef's knife, rolling pin, piping bags, offset spatula, wooden spoon)
- `src/dessert3d.js`: procedural 3D desserts (each step's part tagged so it can be built live at a station) and mixing bowls
- `src/characters.js`: chibi animals
- `src/viewmodel.js`: first-person paws
- `src/input.js`: keyboard, pointer lock, drag look and touch
- `src/ui.js`: DOM for tickets, bubbles, mini-games and the book
- `src/toon.js`, `src/merge.js`, `src/sticker.js`: toon materials, outlines, batching, 2D sticker helpers
- `src/fx.js`, `src/audio.js`: particles and synthesized sound effects
