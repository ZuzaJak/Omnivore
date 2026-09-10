# Omnivore — A Primordial Microcosm

A dark, atmospheric 2D biological web game developed with HTML5 Canvas and vanilla JavaScript. Experience life in a deep primordial abyss: evolve from a fragile microscopic organism into an apex predator while managing viscous fluid inertia and jet-propulsion dashing.

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
