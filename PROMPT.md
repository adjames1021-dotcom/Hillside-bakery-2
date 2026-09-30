# Hillside Bakery: game prompt (v2)

An improved version of the original prompt. It asks for a first-person game, a real pantry with Dry and Cold Storage, a center prep island, deeper step-by-step recipes and better graphics. The game in this repository is built from it.

---

## The pitch

Build a cozy **first-person** baking game in Three.js. You are a small fox baker in a tiny hillside bakery. Animal customers come in and sit at café tables. You walk up and take their order, and it becomes a paper ticket with a recipe card. Then you gather ingredients from **Dry Storage** and **Cold Storage** and work through the recipe at the kitchen stations. Serve the finished dessert at the table. There is no failing: mistakes only lower a treat's 1–3 star quality. The mood is a warm afternoon in a tiny shop: calm, wholesome and bouncy.

## Camera and controls

- **First person** is the whole game. Eye height is about 1.25 m (a chibi animal), FOV 72° on desktop and wider on portrait phones, with a very gentle head-bob and soft footsteps.
- **Desktop:** mouse look with pointer lock, WASD to walk, E, Space or click to use, 1–4 to pick a ticket, R for the recipe book, Q to step back from a station. If pointer lock is unavailable (for example in an embedded frame), fall back to drag-to-look, and count a press as a click only if the mouse doesn't move.
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

Each dessert is a card of 3–7 steps done in order. The active ticket shows every step, where it happens and which ingredients or toppings it needs.

| Step | Where | How it plays |
| --- | --- | --- |
| **Gather** | Dry / Cold Storage | Grab each listed ingredient. Some recipes gather twice (crust first, filling later). |
| **Mix** (knead, whisk, cream, whip, blend) | Mixing Bowl | Close-up mini-game: wiggle the mouse in circles, or tap Space, to fill the meter while the whisk spins. |
| **Prep** (roll, chop, slice, scoop, fill, pour, cut) | Prep Island | Close-up mini-game in one of four modes: **tap** (N chops), **roll** (move the mouse up and down), **wiggle** (scoop or spin), **hold** (pour). |
| **Bake** | Oven | Passive. A gauge runs baking → **golden** → toasty → burnt, and the oven dings at golden. Take it out while golden for full stars. Toasty costs 1 star and burnt costs 2, and the treat turns darker. |
| **Cook** (fry, melt, toast) | Stove | Passive, but the pot calls "Stir!" twice. Stir within about 5 s or it scorches (−1 star). |
| **Chill** (set, frost, freeze) | Freezer | Passive. The lid pops open when it's done. |
| **Decorate** | Decorating Table | A palette of 12 toppings (whipped cream, frosting, hot fudge, pink icing, sugar glaze, sprinkles, cherries, strawberries, chopped nuts, powdered sugar, caramel, chocolate curls). Add the ones on the card in order. Two or more mistakes cost a star. |

Rules:

- One item per ticket. It lives in your paws, at a station, or on an island spot. Passive stations keep working while you start other orders, and that multitasking is the skill.
- The treat you carry changes as you go: a bowl with each ingredient in its own little pile (flour mound, butter cubes, a cracked egg, berries, a milk pool), then a bowl of batter, then a pale unbaked version, then a plain baked version, then the decorated final.
- If a customer leaves, their treat stays on the counter and joins the next order for the same dessert.
- Examples:
  - **Apple Pie:** gather flour, butter, apples, cinnamon → knead the dough → roll & fill the crust → bake until golden.
  - **Pecan Pie:** gather flour, butter → knead → roll the crust → gather pecans, caramel, eggs → arrange the pecans → bake.
  - **Cheesecake:** gather graham, butter → press the crust → gather cream cheese, eggs, sugar → beat until silky → bake gently → chill → decorate with strawberries.
  - **Glazed Donuts:** gather flour, milk, eggs, sugar → knead → cut rings → fry (stir!) → decorate with sugar glaze and sprinkles.
  - **Sundae:** gather ice cream → scoop → decorate with hot fudge, whipped cream and a cherry.

## Customers and progression

- Chibi cats, bunnies, bears and puppies walk in through the door with a puff and sit down.
- A bouncing **!** bubble means they're ready to order. After you take the order, the bubble shows the dessert sticker and a patience bar that turns orange when low. Customers are patient: a few minutes per order, more for longer recipes.
- Customers wave and turn their heads to look at you when you're close. They eat in three bites with hearts, then leave.
- Coins depend on recipe length, stars and remaining patience. Serving treats unlocks menu sections in this order: Pies and Cookies at the start, then Pastries (3 served), Cakes (6), Cold & Frozen (10) and Candy & Campfire (14).
- Early orders favour short recipes. At most 2 customers at once, rising to 4.

## Art direction

- **Shapes:** chunky, soft and rounded, like vinyl toys or clay miniatures. Everything is built from rounded boxes and rounded lathe shapes, with squat, toy-like proportions and nothing thin or sharp.
- **Shading:** flat toon shading with a 4-step gradient, whose darkest step stays warm and light. There is one warm sun plus a hemisphere light, and warm point lights under dome pendants give stepped pools of light.
- **Line art:** a chocolate-brown ink outline (#4B2E1D, never black) of even pixel width. Use inverted hulls with averaged normals so hard edges don't gap. Lines thin out gently with distance in first person.
- **Palette:** creams #F8E8C8 and #FFF3DC, apricot #F4A646, pumpkin #E8893A, honey wood, butter yellow, soft pink, sage and powder blue. No cold greys.
- **Faces:** only the customers have faces. Appliances stay plain and cute through their shapes and colors.
- **Decor:** gingham, scalloped awnings, string lights, bunting between the beams, potted plants, wicker baskets, flour sacks with hand-lettered labels, framed pictures and wall sconces.
- **Effects:** additive glows on lamps and bulbs, white puff clouds, hearts, sparkles, floating coins, steam from hot treats and chimneys, and dust motes in the window light.
- **Desserts:** real 3D clay-miniature models, built procedurally from about 30 templates (pies with lattices, layered cake wedges, cupcakes, cookies, bars, donuts, sundaes, floats and more). Each has plain, unbaked and toasty variants. Flat sticker icons of the same desserts are used in the UI.

## UI

- Rounded "Fredoka"-style font. Cream pill buttons with thick brown borders and a hard drop shadow, with orange for primary actions.
- **Tickets** are paper cards pinned at the top left. The active one shows the numbered steps, with ingredient and topping icons that tick off as you go.
- World speech bubbles with tails float over customers and busy stations: oven gauge, "Stir!", "Chilled!".
- A bottom line always says what you're carrying and what to do next.
- A mini-game card appears at the bottom during station close-ups.
- The recipe book lists every recipe card by section.

## Tech

- Three.js with `MeshToonMaterial` on a 4-step gradient map, screen-space inverted-hull outlines, `RoundedBoxGeometry`, canvas-drawn flat textures with world-space UVs (so wallpaper and planks tile evenly) and a shared label atlas.
- Bake the sun's shadow map once, since the room is static. Characters use soft blob shadows.
- Merge static meshes by material to keep the room to a few hundred draw calls. Lower the pixel ratio automatically on slow devices.
- Save coins and progress in `localStorage`.

## The 50 desserts

**Pies & Cobblers:** apple pie (golden lattice, cinnamon-apple filling, steam), pecan pie (glossy caramel filling, pecan halves, fluted crust), key lime pie (pale green filling, whipped rosettes, lime slice), pumpkin pie (smooth orange filling, whipped dollop, nutmeg), cherry pie (deep red filling through a sugared lattice), banana cream pie (mounded cream, banana slices, chocolate shavings), blueberry pie (purple filling oozing from a lattice), sweet potato pie (orange-brown filling, toasted edge), Mississippi mud pie (dark chocolate, cookie crust, whipped topping), peach cobbler (cast-iron skillet, golden biscuit topping), apple crisp (oat and brown-sugar crumble).

**Cakes:** New York cheesecake (graham crust, strawberry topping), cupcake (swirled buttercream, sprinkles, paper liner), red velvet (red layers, cream cheese frosting), Boston cream pie (sponge, custard, ganache drip), carrot cake (spiced layers, cream cheese frosting, walnuts), devil's food cake (dark layers, fudge frosting), pineapple upside-down cake (caramelized rings and cherries), German chocolate cake (coconut-pecan filling), angel food cake (tall, airy, powdered sugar), pound cake (golden loaf, slices, glaze), strawberry shortcake (split biscuit, berries, cream), whoopie pies (chocolate halves, white filling).

**Cookies & Bars:** chocolate chip cookies, brownies, snickerdoodles, lemon bars, Rice Krispies treats, oatmeal raisin cookies, peanut butter cookies (fork crisscross), frosted sugar cookies (pastel icing, rainbow sprinkles).

**Pastries & Fried Treats:** glazed donuts, cinnamon rolls, funnel cake, apple fritters, blueberry muffins, beignets, bread pudding with caramel.

**Cold & Frozen:** ice cream sundae, milkshake (striped straw), banana pudding (wafers and bananas in a glass dish), banana split, root beer float, baked Alaska, ice cream sandwich.

**Candy & Campfire:** s'mores, caramel apple (crushed nuts), chocolate fudge on wax paper, pralines, cotton candy (pink and blue on a paper cone).
