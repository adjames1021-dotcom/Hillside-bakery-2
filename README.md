# Hillside Bakery

A cozy little bakery game in a toon diorama. Walk your fox baker around a tiny hillside shop,
bake 50 classic American desserts and serve them to chibi cat, bunny, bear and puppy customers.

## Play

The game is static files (ES modules + Three.js from a CDN), so serve the folder over HTTP:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

| Action | Keyboard | Touch |
| --- | --- | --- |
| Walk | WASD / arrow keys | left joystick |
| Use (pantry, stations, customers) | E, Space or Enter | **Use** button |
| Recipe book | R | **Recipes** button |
| Switch diorama / first-person "Baker's eyes" view | V | **Baker's eyes** button |

In Baker's eyes view, W/S walk, A/D turn, and dragging looks around.

## How it works

1. A customer walks in and sits down with an order bubble and a patience bar.
2. Open the recipe book at the **pantry shelf** and pick the treat.
3. Carry it through its stations: Mixing Bowl, Oven, Stove, Fridge and Decorating Table.
   Each station works on its own, so you can start one treat while another bakes.
4. Pick up the finished treat and bring it to the customer for coins and hearts.

Serving treats unlocks new menu sections: Pies & Cobblers and Cookies & Bars at the start,
then Pastries & Fried Treats, Cakes, Cold & Frozen, and Candy & Campfire.
Coins and progress are saved in the browser.

## Look

- `MeshToonMaterial` with a 4-step gradient map, one warm sun from the upper left plus a hemisphere light, soft baked shadows
- Inverted-hull outlines in `#4B2E1D`, pushed out in screen space so lines stay the same pixel width
- `RoundedBoxGeometry` and rounded lathe shapes for chunky, vinyl-toy furniture
- Orthographic camera at a 35° isometric angle over a cutaway room on a thick slab
- Additive sprite glows for string lights, sconces and the oven; flat canvas textures for wallpaper, gingham and labels
- Every dessert is a hand-coded canvas sticker (`src/desserts.js`)

## Files

- `index.html` – page, HUD, recipe book and styles
- `src/main.js` – game loop, input, cameras, customers and stations
- `src/world.js` – the room, stations with faces and decor
- `src/characters.js` – chibi animals
- `src/desserts.js` – the 50-dessert menu and sticker painter
- `src/toon.js` – toon materials, outlines, geometry helpers
- `src/fx.js`, `src/audio.js` – particles and synthesized sound effects
