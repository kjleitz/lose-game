# ADR-0003: Rendering Strategy and Game Loop

## Status

Accepted

## Context

We render to a single canvas and need smooth updates across variable frame rates.

## Decision

- Use a fixed-timestep loop with an accumulator (default 60 Hz) and a cap on updates per frame to avoid death spirals.
- Decouple render from update: always render once per RAF tick.
- Implement HiDPI scaling: set canvas width/height to CSS size × `devicePixelRatio`, draw with `setTransform(dpr, 0, 0, dpr, 0, 0)`.
- Bind RAF: call `window.requestAnimationFrame`/`cancelAnimationFrame` to avoid “Illegal invocation”.

## Consequences

- Stable physics/integration, consistent input handling
- Crisp visuals on retina displays
- Ready to add camera/layers; OffscreenCanvas remains an optimization for later
