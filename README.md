# Hillside Bakery

A cozy first-person baking game in a toon bakery. You're a little fox baker: take orders from chibi cat, bunny, bear and puppy customers, gather ingredients from **Dry Storage** and **Cold Storage**, work each recipe card step by step at the kitchen stations and the center **prep island**, then serve the finished dessert at their table.

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
| Step back from a station | Q | **Step back** |

## How a recipe works

1. A customer sits down with a **!** bubble. Look at them and press E to take the order. A ticket appears with the recipe card.
2. **Gather** the listed ingredients. Dry goods and produce are on the left wall and the front crates. Dairy, berries, citrus and ice cream are in the glass Cold Storage.
3. Follow the card:
   - **Mixing Bowl:** wiggle the mouse or tap to knead, whisk or whip.
   - **Prep Island:** roll, chop, scoop, fill or pour.
   - **Oven:** take it out while the gauge is golden. Toasty or burnt costs stars.
   - **Stove:** stir when the pot calls, or it scorches.
   - **Freezer:** chill and set.
   - **Decorating Table:** add the toppings from the card, in order.
4. Serve it for coins, hearts and a 1–3 star rating. Stations keep working on their own, so you can juggle orders, and the island has two spots for setting things down.

Serving treats unlocks new sections: Pastries at 3 served, Cakes at 6, Cold & Frozen at 10, Candy & Campfire at 14. Coins and progress are saved in the browser.

## Look and tech

- `MeshToonMaterial` with a 4-step gradient; one warm sun and a hemisphere light, plus warm pendant point lights; the shadow map is baked once.
- Inverted-hull outlines in `#4B2E1D`, pushed out in screen space with smoothed normals, thinning with distance in first person. A butter-yellow highlight hull marks what the crosshair is on.
- `RoundedBoxGeometry` and rounded lathe shapes, and procedural 3D clay-miniature desserts (`src/dessert3d.js`) with unbaked, plain, toasty and decorated variants.
- Flat canvas textures with world-space UVs, a shared hand-lettered label atlas, additive glow sprites, dust motes, and a painted hillside seen through real window openings.
- Static meshes are merged by material (a few hundred draw calls). The pixel ratio drops automatically on slow devices.
- The title screen is the original isometric cutaway diorama, and the camera swoops into the baker's eyes.

## Files

- `index.html`: page, HUD, tickets, mini-game card, recipe book and styles
- `src/main.js`: game loop, first-person camera, targeting, orders, stations, mini-games, customers
- `src/world.js`: the room, stations, island, Dry and Cold Storage, café, lighting
- `src/props.js`: reusable furniture and flat textures
- `src/desserts.js`: the 50 desserts, recipe cards, toppings and sticker art
- `src/ingredients.js`: 33 ingredients with stickers, 3D models and the label atlas
- `src/dessert3d.js`: procedural 3D desserts and mixing bowls
- `src/characters.js`: chibi animals
- `src/viewmodel.js`: first-person paws
- `src/input.js`: keyboard, pointer lock, drag look and touch
- `src/ui.js`: DOM for tickets, bubbles, mini-games and the book
- `src/toon.js`, `src/merge.js`, `src/sticker.js`: toon materials, outlines, batching, 2D sticker helpers
- `src/fx.js`, `src/audio.js`: particles and synthesized sound effects
