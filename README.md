# Colour Palette Picker

https://github.com/user-attachments/assets/1ed17bce-6658-44eb-9f53-77aa48314448

## Use it

[colour-palette-picker.jubinvillecam.workers.dev](https://colour-palette-picker.jubinvillecam.workers.dev/)

A colour palette picker built with barebones React + Vite and vibe coding. 

It's meant to be as lean as possible, and startup very quick.
I was getting frustrated with the various colour palette generator websites, as they always show you the colours side by side, but they never show you what they look like
with a background, or if you drew on top of them. I like having a simple canvas and experimenting with my colours that way so I can gauge how they look together, so a simple canvas like this works.

This can be replaced by any other drawing canvas tool, I just find that this works for my workflow, as it starts quick and gets me what I need quickly.

## Features

- Drawing canvas with Select, Rectangle, Circle, and Pen tools
- Drag, multi-select, and delete shapes
- Double-click a shape to edit its colour
- Colour palette panel sorted by luminance
- Recolour all shapes of a given colour at once
- Randomize palette while preserving brightness
- Undo / Redo and Clear canvas
- Keyboard shortcuts for everything

## Commands

- `npm run dev` — start dev server
- `npm run build` — build for production
- `npm run preview` — preview production build
- `npm run lint` — run oxlint

## Contributing

Contributions are welcome. Open an issue or submit a PR.

- Do NOT add any node_modules unless absolutely necessary.
- Fast startup is the #1 priority.
