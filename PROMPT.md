# Hillside Bakery: game prompt (v5)

An improved version of the original prompt. It asks for a first-person game, a real pantry with Dry and Cold Storage, a center prep island, deep step-by-step recipes with ingredient prep and signature mini-games, stations whose tools visibly do the work, custom orders, a day-by-day shop loop with a morning market, detailed clay-miniature food with nothing clipping, a second venue (a seaside restaurant with waiters), and two-player online co-op with a rush that builds through the day. The game in this repository is built from it.

---

## The pitch

Build a cozy **first-person** baking game in Three.js. You are a small fox baker running a tiny hillside bakery one day at a time. Animal customers come in and sit at café tables. You walk up and take their order, and it becomes a paper ticket with a recipe card. Then you gather and prep ingredients from **Dry Storage** and **Cold Storage** and work through the recipe at the kitchen stations, where every step is a small hands-on game. Serve the finished dessert at the table, and after closing, spend your coins at the morning market. There is no failing: mistakes only lower a treat's 1–3 star quality. The mood is a warm afternoon in a tiny shop: calm, wholesome and bouncy.

## Camera and controls

- **First person** is the whole game. Eye height is about 1.25 m (a chibi animal), FOV 72° on desktop and wider on portrait phones, with a very gentle head-bob and soft footsteps.
- **Desktop:** mouse look with pointer lock, WASD to walk, E, Space or click to use, 1–4 to pick a ticket, R for the recipe book, B for the morning market, A/D or the arrow keys for left/right games, 1–9 for layers, Q to step back from a station. If pointer lock is unavailable (for example in an embedded frame), fall back to drag-to-look, and count a press as a click only if the mouse doesn't move.
- **Touch:** a left joystick to walk, drag anywhere to look, and a big orange **Use** button.
- **Aiming:** a small crosshair picks whatever it points at within about 2.4 m. The target gets a warm butter-yellow outline and a pill prompt such as "E · Grab Apples". Pick the target by distance along the ray plus distance from the crosshair line, so neighbouring crates don't steal the aim.
- **Paws:** show two fluffy fox paws in chef sleeves at the bottom of the screen. They carry the current item (a mixing bowl, then the dessert on a plate), reach out when you grab something, and bob only slightly as you walk. Everything placed on counters, shelves and tables must rest on the surface, never float. Render them in a separate pass so they never clip into counters.
- **Title screen:** the isometric cutaway diorama from the original prompt, with a narrow-FOV camera at 35°. "Open the shop" swoops the camera down into the baker's eyes.

## The room

12 × 10 m with a 3.6 m ceiling and wood beams.

- **Left wall (kitchen):** a retro glass-door Oven (you can watch the treat bake on the rack), Stove with a pot and pan, Mixing Bowl counter, then Dry Storage.
- **Back wall:** chest Freezer, Decorating Table, Scrap Basket, a window with a bread bench, and the front door, which customers use.
- **Center:** a **prep island** with a butcher-block top. It holds a cutting board, rolling pin and knife (the prep station) and **two set-down spots** where you can park a treat when your paws are full.
- **Front and right walls:** glass-door **Cold Storage**, a produce stand, a big window with a window seat, and a sideboard with cakes under glass domes.
- **Café:** two round tables with gingham cloths, stubby chairs and a striped rug.
- Windows are real openings looking out on a painted hillside backdrop (rolling hills, round trees, a picket fence, little houses), so there is parallax as you move.

## Storage (the pantry)

Every ingredient is a small 3D object on a shelf, with a hand-lettered tag. You grab one at a time by looking at it and pressing Use. It pops into the bowl in your paws, and its icon ticks off on the ticket.

- **Dry Storage:** a 5 × 3 cubby shelf with a "Dry Storage" sign. It holds sacks (flour, sugar, oats), jars (cinnamon sticks, pecans, raisins, caramel, peanut butter), boxes (graham crackers, crispy rice), marshmallows, coconut, chocolate bars and a bread basket. Tilted produce crates sit under a scalloped awning: apples, peaches, bananas, pumpkins, sweet potatoes, a pineapple and carrots.
- **Cold Storage:** a powder-blue double-door glass fridge with a "Cold Storage" sign. It holds milk, cream, root beer, ice cream, butter, eggs, cream cheese, lemons, strawberries, blueberries, cherries and limes. The glass door swings open when you reach in.
- Grabbing something the current step doesn't need gets a gentle "the Apple Pie doesn't use Cocoa" and nothing is added.

## Recipe cards (the deeper cooking)

Each dessert is a card of 3–8 steps done in order (about 5.5 on average). The active ticket shows every step, where it happens and which ingredients or toppings it needs. Recipes must not feel repetitive: each has its own **signature step** (weave the lattice, crimp the edges, pipe the swirl, layer the pudding, dip and twirl, spin the floss), and the same station plays differently depending on the verb on the card.

**Mise en place.** Staples (flour, sugar, butter, milk, oats…) go straight into the bowl. Special ingredients must be prepped at the island before the gather step counts as done, so the ingredients that make a recipe special also shape how it plays:

- crack the eggs (timing), pit the cherries (timing)
- peel the apples (circles), core the pineapple (circles)
- slice the peaches, hull the strawberries (taps)
- peel the bananas (side to side)
- grate the carrots, zest the lemons (roll)
- squeeze the limes (hold)
- mash the sweet potatoes and pumpkin; chop the chocolate, pecans and bread (taps)

A "!" in the recipe data means use it whole (the apple on a caramel apple, the chocolate square in a s'more). The ticket shows a little knife badge on ingredients that need prep. While you prep, the whole ingredient sits on the cutting board and shrinks with each stroke as a pile of prepped pieces (slices, cubes, shreds, cracked eggs) grows beside it; when it's done the pile hops into the bowl, which waits beside the board on the side away from you.

**Mini-games.** Every active step is one of these, shown in a card at the bottom of a close-up camera:

| Game | Controls | Used for |
| --- | --- | --- |
| Tap | Click, tap or Space per stroke | chop, press a crumb crust, knead |
| Timing | Tap while a sliding marker is in the green zone. The zone moves and the slider speeds up after each hit. Three misses cost a star. | crimp edges, cut rings and shapes, scoop dough balls, split a banana, flip a cake, float a scoop |
| Pour to the line | Hold to fill a gauge and let go inside the striped band. Overfilling or spilling costs a star. | fill liners and cups, pour filling, dip in glaze, scoop ice cream |
| Circles | Move the mouse or a finger in circles of any size, either way. Track the pointer's angle around a center that trails behind it, so only real turning counts, not back-and-forth or jitter. | pipe buttercream, whisk, beat, peel, smooth, spin cotton candy |
| Side to side | Sweep left and right (a sweep counts once it has travelled far enough; a small wobble back doesn't end it), or tap A and D | fold, scatter crumble, drizzle glaze or caramel |
| Left / right | Alternate with A/D, the arrow keys, mouse flicks or two big buttons. Going to the wrong side three times costs a star. | weave a lattice, fork crisscross |
| Layers | Press layer chips in the right order (keys 1–9). Two mistakes cost a star. | banana pudding, layered and stacked cakes, s'mores, shortcake |
| Roll / hold / wiggle | Move up and down, hold, or wiggle | roll out dough, squeeze, beat fudge |

The **Mixing Bowl** reads the verb on the card: *knead* is tapping, *fold / stir / soak* is side to side, and *whisk / beat / cream / whip / blend* is circles. **Bake** (Oven), **Cook** (Stove; stir twice when it bubbles) and **Chill** (Freezer) stay passive so you can juggle orders. The oven gauge runs baking → golden → toasty → burnt, and you can watch the treat through the glass door. The **Decorating Table** has a palette of 12 toppings, added in ticket order. A small animated dot on the mini-game card shows the gesture for the mouse games.

**Stations do the work you can see.** Every action should look like what the card says:

- **Close-ups:** the camera eases in to a square-on view of the station (at the island, from the side you stand at), with the work framed in the space between the top HUD and the mini-game card. Heavy appliances like the oven never bounce or wobble.
- **Tools look like real tools:** a chef's knife with a curved edge, bolster and riveted handle; a tapered rolling pin with turned handles; cloth piping bags with a fluted metal star tip and a tied top whose belly squeezes and empties as you pipe; an offset spatula; a wooden spoon; a fox paw with toe beans. Chopping comes down fast, slides through and lifts; chips and crumbs fly off and settle on the food or the board. Bottles and the piping bag pour a stream onto the treat, shakers rain sprinkles and sugar, and the decorating tools turn smoothly instead of snapping.
- **Prep Island:** the cutting board has a rolling pin and knife resting on it, and other tools (piping bag, spatula, spoon, scoop, pitcher, fork, tamper, a paw) come out only while they're needed. Tools follow your input in screen terms, wherever you stand: the knife chops where the timing slider is, edge-down and side-on; the pin lies across your view and rolls toward and away from you under the mouse; the bag and spatula trace your circles; the pitcher tips and pours a stream while you hold; the tamper presses on each tap. The part of the treat the step adds is built live: lattice strips and star vents pop in one at a time, frosting and fillings grow, layers stack, a s'more squishes down, an upside-down cake turns over.
- **Mixing Bowl:** a side-on stand mixer with whisk, dough hook and paddle attachments. The bowl starts with chunks in the colours of what you gathered and blends to the batter colour as you mix; dough squashes with each knead.
- **Stove:** an open pot you can see into, coloured by what's cooking (cherries, custard, fudge, caramel…), with bubbles that pop faster when it needs a stir. Fried treats sit in a pan of shimmering oil and flip into the air when you flip them; marshmallows toast golden on a skewer over the flame.
- **Oven:** the door drops open when you load it, and treats bake on a tray (no dinner plates in the oven), puffing up a little as they bake.
- **Freezer:** a chest freezer whose lid lifts and whose wire tray lowers the treat in, then raises it when it's set.
- **Decorating Table:** a turntable stand; each topping's tool (shaker, sugar sifter, squeeze bottles, piping bag, fruit and nut dishes) hops over the treat, shakes or drizzles, and the topping lands while it's there.
- Step back any time and your progress stays; if you step back the moment a step finishes, the treat still comes back to your paws.

Rules:

- One item per ticket. It lives in your paws, at a station, or on an island spot. Passive stations keep working while you start other orders, and that multitasking is the skill.
- The treat you carry changes as you go: a bowl with each ingredient in its own little pile, then a bowl of batter, then the treat itself with only the steps done so far (a bare crust, then the lattice), pale before baking, then the decorated final.
- If a customer leaves, their treat stays on the counter and joins the next order for the same dessert.
- Examples:
  - **Apple Pie:** gather flour, butter, apples, cinnamon → peel the apples → knead → roll out the crust → weave the lattice (left/right) → bake until golden.
  - **Pecan Pie:** gather flour, butter → knead → roll the crust → crimp the edges (timing) → gather pecans, caramel, eggs → chop the pecans, crack the eggs → pour in the filling (pour to the line) → bake until set.
  - **Banana Pudding:** gather bananas, milk, eggs, sugar → peel the bananas, crack the eggs → stir the custard → layer wafers, bananas, custard ×2 (layers) → chill → whipped cream.
  - **Cupcake:** gather and crack the eggs → whisk (circles) → fill the liners (pour) → bake → pipe the buttercream swirl (circles) → sprinkles and a cherry.
  - **Cotton Candy:** melt the sugar → spin the floss (circles).

## Custom orders

- Regulars sometimes make a **special request**, shown as a tag on the ticket and under their bubble:
  - **+ a topping** (extra sprinkles, fudge, strawberries…)
  - **Make it pink**
  - **No nuts** (the nuts topping comes off the card)
  - **Extra toasty** (the toasty oven zone gives full stars and golden costs one)
  - **In a hurry** (less patience, 1.5× coins)

  Requests pay a small bonus. Follow the ticket, not the recipe book.
- From day 3 some customers order **two treats**. They get two linked tickets ("1 of 2", "2 of 2") and one shared patience bar, and they wait for both plates before eating.

## The shop day

- **Morning (8 AM):** the door sign says Closed. A **daily special** is picked; it pays +50% coins, or double with the Specials Board. Flip the sign at the door to open, or it opens itself at 9. B opens the market during the morning.
- **Open (9 AM to 5 PM, about 6.5 minutes):** customers come in, at most 2–4 at once depending on the day. Last orders are at 4:30. At 5 the sign flips, and anyone still waiting gets a shorter fuse.
- **Day summary:** treats served, coins, tips, average stars, customers who went home hungry, the crowd favourite and what joins the menu tomorrow.
- **Morning market:** three tabs.
  - **Pantry:** each ingredient has a shelf count (8, or 14 with Bigger Shelves), and every grab uses one. Restock one ingredient or everything at 1–3 coins per unit.
  - **Upgrades:** Speedy Oven, Oven Thermometer, Stand Mixer, Sharp Knife, Copper Pot, Frosty Freezer, Comfy Cushions, Tip Jar and Bigger Shelves.
  - **Decor** that appears in the room, each with a small bonus: Sunflower Planters, Paper Lanterns, Hanging Ferns, a Specials chalkboard easel that shows today's special, and a sleeping Shop Cat.
- Customers only order what the pantry can still make. The prompt says "Grab Apples (4 left)", and an empty shelf says "Out of Apples!".
- Menu sections join by day: Pies and Cookies on day 1, Pastries on day 2, Cakes on day 3, Cold & Frozen on day 4, and Candy & Campfire on day 5.

## Customers and progression

- Chibi cats, bunnies, bears and puppies walk in through the door with a puff and sit down.
- A bouncing **!** bubble means they're ready to order. After you take the order, the bubble shows the dessert sticker and a patience bar that turns orange when low. Customers are patient: a few minutes per order, more for longer recipes.
- Customers wave and turn their heads to look at you when you're close. They eat in three bites with hearts, then leave.
- Coins depend on recipe length, stars, remaining patience, special requests, the daily special, decor bonuses and the tip jar.
- Early orders on day 1 favour short recipes. At most 2 customers at once, rising to 4 by day 3.

## A second kitchen: Lantern Cliff

- The title card has a venue picker: **Hillside Bakery** or **Lantern Cliff**. Each venue has its own world, menu, ingredients, upgrades, decor and save. Switching reloads the page into the other kitchen.
- **Lantern Cliff** is a fancy open kitchen high on a sheer sandstone cliff (about ten metres of ledges, boulders and grass tufts down to a jetty) above the sea at sunset, with sailboats drifting slowly around it. Its prep counter is stainless steel with a poly board, and its plating station is a heat-lamp pass with chef's garnishing tools, not the bakery's. Dishes sit on smaller fine-dining plates so the food fills them, raw food is prepped on the board before it's plated, and seared meat browns as soon as it's seared. Place settings have a charger, fork, knife, napkin and wine glass, and guests eat the food off the plate: a checkered kitchen floor, a walnut dining room with white tablecloths, navy walls, copper and marble stations, glass walls looking out at the sea, a lighthouse, islands, sailboats and lanterns.
- **Waiters** in vests and bow ties (Pierre and Lulu, and a third with an upgrade) do the front of house. A waiter walks to a seated guest, bows while writing the order, carries the ticket to **the pass** (a counter between kitchen and dining room), and the ticket appears in the kitchen. The chef cooks and sets the finished plate on the pass; a waiter picks it up on a tray, carries it to the right table and serves it. You can watch them walk the room.
- 21 dishes in six sections: Starters & Soups and Pasta & Risotto (day 1), From the Sea (2), From the Grill (3), Desserts (4) and Chef's Signatures (5). Searing and frying turn the food into the dish right there in the pan. Plating replaces decorating, with garnishes such as herbs, basil, parmesan, pepper, olive oil, balsamic, edible flowers and berries.
- Its own market: Stone Hearth Oven, Probe Thermometer, Pro Blender, Japanese Knife Set, Copper Cookware, Turbo Chiller, Third Waiter, Quick Runners, Velvet Chairs, Maître d' and Walk-in Pantry; decor of table candles, roses, a grand piano, a chef's menu board and a crystal chandelier.

## Two-chef co-op (Cloudflare Workers)

- **Co-op with a friend** on the title card opens a lobby: type a name, create a room (a four-letter code and an invite link) or join one. Two chefs per room.
- The host picks the **kitchen** (both players reload into it and rejoin automatically) and the **difficulty** with a five-step slider (Cozy, Easy, Normal, Busy, Frantic) that sets guest patience, arrival rate, how many guests come at once, how hard the rush hits, the walkout penalty and the coin bonus. The guest sees the choices live. **Start the day together** starts both games.
- **Like a busy service, the rush builds.** The day starts calm and gets busier as the clock runs; three rush waves (lunch, afternoon and a final rush, or sunset and dinner at the restaurant) arrive with a big banner, a burst of guests, shorter patience and more two-dish orders. A rush meter shows Calm, Busy, Rush! or Frantic!. Last orders get their own banner.
- **Throwing:** look at your partner and press E, or press T within 8 m, to throw what you're holding; it arcs into their paws if they're free. **Chat** in the lobby and in the kitchen (Enter), shown in a fading corner log and as a bubble over the speaker. **Tickets:** both chefs' selected recipes stay open, tagged with the partner's name, and any other ticket can be pinned open.
- Mechanics that make two chefs work: one chef per station close-up (the other gets "Bo is working at the Prep Island"); a team **streak** that raises coins up to ×1.4 for guests served in a row; a **walkout penalty** that costs coins and breaks the streak; a **ping** (G) that drops a marker on whatever you're looking at; the partner shown as a fox with a name tag carrying what they carry; a kitchen that keeps running when one chef pauses; and a team rating on the day summary. The host runs the morning market and keeps the save; the guest waits on the summary card.
- **Networking:** a Cloudflare Worker serves the game and a Durable Object per room (WebSocket hibernation API) keeps the lobby and relays messages. The host's browser is authoritative: it runs customers, timers and coins and sends a compact snapshot about ten times a second. The guest's browser mirrors that kitchen and sends its actions (with a sequence number) for the host to run as the guest, with the guest's paws and selected ticket. The guest's sounds and messages go back to the guest. Station mini-games run on the guest's screen and report the result. The guest ignores snapshots until the host has handled its latest action, so nothing flickers back.

## Art direction

- **Shapes:** chunky, soft and rounded, like vinyl toys or clay miniatures. Everything is built from rounded boxes and rounded lathe shapes, with squat, toy-like proportions and nothing thin or sharp.
- **Shading:** flat toon shading with a 4-step gradient, whose darkest step stays warm and light. There is one warm sun plus a hemisphere light, and warm point lights under dome pendants give stepped pools of light.
- **Line art:** a chocolate-brown ink outline (#4B2E1D, never black) of even pixel width. Use inverted hulls with averaged normals so hard edges don't gap. Lines thin out gently with distance in first person.
- **Palette:** creams #F8E8C8 and #FFF3DC, apricot #F4A646, pumpkin #E8893A, honey wood, butter yellow, soft pink, sage and powder blue. No cold greys.
- **Faces:** only the customers have faces. Appliances stay plain and cute through their shapes and colors.
- **Decor:** gingham, scalloped awnings, string lights, bunting between the beams, potted plants, wicker baskets, flour sacks with hand-lettered labels, framed pictures and wall sconces.
- **Effects:** additive glows on lamps and bulbs, white puff clouds, hearts, sparkles, floating coins, steam from hot treats and chimneys, and dust motes in the window light.
- **Desserts:** real 3D clay-miniature models, built procedurally from about 30 templates (pies, layered cake wedges, cupcakes, cookies, bars, donuts, sundaes, floats and more). Each has plain, unbaked and toasty variants. Flat sticker icons of the same desserts are used in the UI. Add detailed shapes where they matter:
  - frosting and whipped cream as a **star-tip piped swirl** (a ridged tube coiling up a cone to a curled tip)
  - pies with a **fluted tin**, a **pinched crust rim** and a real **over-under woven lattice**
  - **pleated** cupcake and muffin liners, and lumpy muffin tops
  - cookies with **irregular hand-made edges** and domed middles
  - glaze drips on donuts, and a fluted ring cake
  - strawberries with seeds and a leafy star
- **Pies:** each of the 11 pies looks distinct and gets richer once baked: crimped edges whose pinched peaks toast darker with dabs of egg-wash shine, lattice strips with a glossy stripe, fanned apple slices with red skins and cinnamon under the apple lattice, whole glossy cherries, rings of ridged pecan halves in caramel, a domed blueberry top crust with pastry leaves, star vents with berries peeking through and filling running over the edge, spiced specks and a set ring on custard pies, lime zest and a lime wheel on key lime, juice bubbling up between the fruit, and a glossy highlight on open fillings. Raw pies stay pale and matte.
- **Ingredients:** fruit uses real lathe silhouettes: dimpled apples with a leaf and blush, peaches, pointed lemons and limes lying on their side, curved tapered bananas with brown tips, ribbed pumpkins, ringed carrots with feathery tops, egg-shaped eggs, and cherries with stems.
- **No clipping, ever:** labels curve around jars and sacks and sit in front of crate slats; treats are scaled to fit the pan, tray, board, stand or freezer they're placed in; plates rest exactly on tables; the paws cradle what you carry from below its edges; sprinkles and sugar land on the real top surface of a treat (found by raycasting), never inside it or on a cherry; shine and frost decals are separate shapes, never coplanar; and the far-away title camera uses a tight near/far range so nothing z-fights.

## UI

- Rounded "Fredoka"-style font. Cream pill buttons with thick brown borders and a hard drop shadow, with orange for primary actions.
- **Tickets** are paper cards pinned at the top left. The active one shows the numbered steps, with ingredient chips that show each ingredient's icon and name (green and crossed off once it's in the bowl), topping icons that tick off as you go, knife badges on ingredients that need prep, and tags for special requests, two-treat orders and the daily special.
- A top-center pill shows the day and a clock face that fills through open hours, next to a pill with today's special.
- World speech bubbles with tails float over customers and busy stations: oven gauge, "Stir!", "Chilled!".
- A bottom line always says what you're carrying and what to do next.
- A mini-game card appears at the bottom during station close-ups: a progress meter, a timing bar with a green zone, a pour gauge with a striped target band, progress pips, Left/Right buttons, or layer chips.
- The day summary is a big cream card, and the morning market is a sheet with Pantry, Upgrades and Decor tabs, sticker icons and stock bars.
- The recipe book lists every recipe card by section.

## Tech

- Three.js with `MeshToonMaterial` on a 4-step gradient map, screen-space inverted-hull outlines, `RoundedBoxGeometry`, canvas-drawn flat textures with world-space UVs (so wallpaper and planks tile evenly) and a shared label atlas.
- Bake the sun's shadow map once, since the room is static. Characters use soft blob shadows.
- Merge static meshes by material to keep the room to a few hundred draw calls. Lower the pixel ratio automatically on slow devices.
- Save coins, the day, pantry stock, upgrades and decor in `localStorage`.

## The 50 desserts

**Pies & Cobblers:** apple pie (golden lattice, cinnamon-apple filling, steam), pecan pie (glossy caramel filling, pecan halves, fluted crust), key lime pie (pale green filling, whipped rosettes, lime slice), pumpkin pie (smooth orange filling, whipped dollop, nutmeg), cherry pie (deep red filling through a sugared lattice), banana cream pie (mounded cream, banana slices, chocolate shavings), blueberry pie (purple filling oozing from a lattice), sweet potato pie (orange-brown filling, toasted edge), Mississippi mud pie (dark chocolate, cookie crust, whipped topping), peach cobbler (cast-iron skillet, golden biscuit topping), apple crisp (oat and brown-sugar crumble).

**Cakes:** New York cheesecake (graham crust, strawberry topping), cupcake (swirled buttercream, sprinkles, paper liner), red velvet (red layers, cream cheese frosting), Boston cream pie (sponge, custard, ganache drip), carrot cake (spiced layers, cream cheese frosting, walnuts), devil's food cake (dark layers, fudge frosting), pineapple upside-down cake (caramelized rings and cherries), German chocolate cake (coconut-pecan filling), angel food cake (tall, airy, powdered sugar), pound cake (golden loaf, slices, glaze), strawberry shortcake (split biscuit, berries, cream), whoopie pies (chocolate halves, white filling).

**Cookies & Bars:** chocolate chip cookies, brownies, snickerdoodles, lemon bars, Rice Krispies treats, oatmeal raisin cookies, peanut butter cookies (fork crisscross), frosted sugar cookies (pastel icing, rainbow sprinkles).

**Pastries & Fried Treats:** glazed donuts, cinnamon rolls, funnel cake, apple fritters, blueberry muffins, beignets, bread pudding with caramel.

**Cold & Frozen:** ice cream sundae, milkshake (striped straw), banana pudding (wafers and bananas in a glass dish), banana split, root beer float, baked Alaska, ice cream sandwich.

**Candy & Campfire:** s'mores, caramel apple (crushed nuts), chocolate fudge on wax paper, pralines, cotton candy (pink and blue on a paper cone).
