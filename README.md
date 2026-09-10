# Omnivore — A Primordial Microcosm

A dark, atmospheric 2D biological web game developed with HTML5 Canvas and vanilla JavaScript. Experience life in a deep primordial abyss: evolve from a fragile microscopic organism into an apex predator while managing viscous fluid inertia and jet-propulsion dashing.

---

## Quick Start

You can run Omnivore in two easy ways:

### Option 1: Direct File Double-Click
Simply double-click `index.html` in Windows Explorer. Omnivore includes an automatic loader that runs immediately without requiring any local server or dependencies.

### Option 2: Local Web Server (Recommended for Native ES Modules)
Double-click `start.bat` or run:
```bash
python -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

---

## Game Mechanics

- **Fluid Locomotion**: The player cell constantly swims toward your mouse cursor. The physics simulates movement in a viscous fluid with inertia, drag, and gradual acceleration.
- **Organic Growth**:
  - Devour organisms smaller than you to assimilate their volume. Mass and visual radius scale proportionally ($A = \pi r^2$).
  - Evade predators larger than you. Getting caught by an apex predator results in assimilation (Game Over).
- **Mass-Speed Tradeoff**: As cells grow larger and accumulate mass, their maximum swimming speed decreases ($v_{\max} \propto R^{-0.44}$), demanding tactical positioning and foresight.
- **Survival Jet Dash**:
  - **Left-Click** or **Spacebar** triggers an instant hydrodynamic jet propulsion dash towards the cursor.
  - Dashing costs **3.5% of your cell's mass**, shedding glowing ejecta droplets into the fluid behind you.

---

## Visual Design & Atmospheric Juice

- **Amoeba Effect**: Cell membranes are procedurally animated using trigonometric harmonic wave equations ($r(\theta) = R \times (1 + \sum A_i \sin(k_i \theta + \omega_i t))$) interpolated with quadratic Bézier splines. Cells stretch along their movement vector and squish under drag.
- **Locomotive Cilia**: Microscopic hair-like cilia wiggle around the player cell. Cilia pointing away from the direction of motion stroke harder to simulate swimming locomotion.
- **Internal Organelles**: Semi-transparent, slowly orbiting internal cellular structures, including a glowing nucleus with chromatin nodes, mitochondria, and vacuoles.
- **Bioluminescent Glow**: Multi-stop radial gradients and canvas `shadowBlur` provide vibrant neon bioluminescence for all species.
- **Dynamic Camera**: Always tracks the player cell at screen center and dynamically zooms out as you grow, maintaining perspective across scale changes.
- **Parallax Abyss**: Multi-layered background featuring distant out-of-focus bokeh orbs (0.15x parallax), floating marine snow/spores (0.45x parallax), and an organic fluid coordinate grid.
- **Visual Impact Juice**: Eaten cells burst into scattering glowing cytoplasm debris particles with velocity decay. Consuming cells flash and expand with gelatinous bounce physics.
- **Procedural Web Audio**: Zero-asset, fully synthesized soundscape using the Web Audio API—featuring deep oceanic abyss drones, hydrodynamic bubble pops, jet whooshes, and death reverberations.

---

## Controls

| Action | Control |
|---|---|
| **Swim / Steer** | Move Mouse Cursor / Touch |
| **Jet Dash** | Left Click / Spacebar / Touch Tap |
| **Pause / Resume** | [P] or [Escape] |
| **Toggle Sound** | [M] or Top-Right Audio Button |

---

## Architecture

- `index.html` — Fullscreen canvas viewport, HUD, glassmorphism overlays
- `css/style.css` — Dark matter atmosphere, responsive layout, glowing HUD
- `js/math.js` — 2D vector mathematics and procedural utilities
- `js/audio.js` — Web Audio API procedural sound engine
- `js/particle.js` — Bioluminescent debris, shockwaves, floating HUD indicators
- `js/cell.js` — Base Cell class with organic membrane undulation and organelles
- `js/player.js` — Player subclass with cilia locomotion and dash mechanics
- `js/aiCell.js` — AI organisms with predator/prey steering behaviors
- `js/background.js` — Parallax bokeh layers and marine snow
- `js/camera.js` — Centered player camera with dynamic zoom & screen shake
- `js/game.js` — Game engine loop, spatial collision resolution, and lifecycle
- `js/main.js` — DOM bootstrap and initialization
