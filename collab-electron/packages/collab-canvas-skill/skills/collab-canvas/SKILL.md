# QuantFlow Canvas

Control QuantFlow's spatial canvas from the terminal using the `qf-canvas` CLI.
The canvas is a pannable, zoomable surface where tiles display terminals, files, images, and graphs.

## Coordinate System

All positions and sizes use **grid units**. One grid unit = 20 pixels.
Origin (0,0) is the top-left corner. X increases rightward, Y increases downward.

## Tile Types

| Type    | Use for                          | Default size (w x h) |
|---------|----------------------------------|-----------------------|
| `term`  | Terminal / shell session         | 20 x 25              |
| `note`  | Markdown files (.md)             | 22 x 27              |
| `code`  | Source code files                | 22 x 27              |
| `image` | Images (.png, .jpg, .gif, .webp) | 14 x 14              |
| `graph` | .graph.json or folder graphs     | 30 x 25              |

Type is inferred from the file when `--file` is used:
- `.md`, `.txt` -> `note`
- `.graph.json` -> `graph`
- `.png`, `.jpg`, `.gif`, `.svg`, `.webp` -> `image`
- Directories -> `graph`
- Everything else -> `code`

## Commands

### qf-canvas tile list

List all tiles on the canvas. Returns JSON array with id, type, position, size, and file path for each tile.

```bash
qf-canvas tile list
```

### qf-canvas tile create

Create a new tile on the canvas.

```bash
qf-canvas tile create <type> [--file <path>] [--pos x,y] [--size w,h]
```

- `<type>`: term, note, code, image, or graph
- `--file <path>`: file to display (required for note, code, image, graph; omit for term)
- `--pos x,y`: position in grid units (default: viewport center)
- `--size w,h`: size in grid units (default: per-type default above)

Returns the new tile's ID on stdout.

**Examples:**
```bash
# Open a terminal at position (5, 5)
qf-canvas tile create term --pos 5,5

# Open a markdown file with default placement
qf-canvas tile create note --file ./README.md

# Open a graph file at a specific position and size
qf-canvas tile create graph --file ./entities.graph.json --pos 25,0 --size 35,30
```

### qf-canvas tile rm

Remove a tile from the canvas.

```bash
qf-canvas tile rm <id>
```

### qf-canvas tile move

Reposition a tile.

```bash
qf-canvas tile move <id> --pos x,y
```

### qf-canvas tile resize

Resize a tile.

```bash
qf-canvas tile resize <id> --size w,h
```

### qf-canvas tile focus

Pan and zoom the viewport to bring one or more tiles into view, then flash their focus rings.

```bash
qf-canvas tile focus <id> [<id>...]
```

**Examples:**
```bash
# Focus a single tile
qf-canvas tile focus tile-abc123

# Focus multiple tiles (viewport zooms to fit all)
qf-canvas tile focus tile-abc123 tile-def456
```

### qf-canvas terminal write

Send input to a terminal tile. The tile must be of type `term` with an active PTY session.

```bash
qf-canvas terminal write <id> <input>
```

**Examples:**
```bash
# Run a command in a terminal tile
qf-canvas terminal write tile-abc123 $'ls -la\n'

# Launch Claude Code in headless JSON mode
qf-canvas terminal write tile-abc123 $'claude -p "fix the bug" --output-format json\n'
```

### qf-canvas terminal read

Read recent output from a terminal tile. Returns raw terminal output from the PTY session's ring buffer.

```bash
qf-canvas terminal read <id> [--lines N]
```

- `--lines N`: number of lines to capture (default: 50)

## Composition Patterns

### Side-by-side comparison

Two files next to each other for comparison.

```bash
qf-canvas tile create code --file ./old.ts --pos 0,0
qf-canvas tile create code --file ./new.ts --pos 23,0
```

### Research workspace

Knowledge graph on the left, notes on the right, terminal below.

```bash
qf-canvas tile create graph --file ./research.graph.json --pos 0,0 --size 30,25
qf-canvas tile create note --file ./notes.md --pos 31,0
qf-canvas tile create term --pos 0,26
```

### Dashboard layout

Multiple views arranged in a grid.

```bash
qf-canvas tile create graph --file ./entities.graph.json --pos 0,0 --size 30,25
qf-canvas tile create note --file ./log.md --pos 31,0
qf-canvas tile create note --file ./report.md --pos 31,14
qf-canvas tile create term --pos 0,26
```

### Focus view

Single tile centered with generous size.

```bash
qf-canvas tile create code --file ./main.ts --pos 5,2 --size 40,35
```

### Agent in a terminal

Launch a Claude Code instance in a terminal tile for the human to observe.

```bash
# Create terminal, wait for PTY, then launch agent
qf-canvas tile create term --pos 0,0
# (use tile list to get the tile ID, then)
qf-canvas terminal write <id> $'claude -p "summarize this project" --output-format json\n'
# Read the result when done
qf-canvas terminal read <id> --lines 100
```

## Conventions

1. **Always `tile list` first** to see what's already on the canvas before creating tiles.
2. **Use `tile focus` to frame** after arranging tiles so the user can see them.
3. **Clean up when done**: remove tiles you created when they're no longer needed.
4. **Leave 1 grid unit gap** between adjacent tiles for visual clarity.
5. **File tiles auto-refresh**: when you write to a file that has a tile, the tile updates automatically. No need to close and reopen.
6. **Graph tiles support incremental updates**: append nodes to a `.graph.json` file and the graph tile smoothly incorporates them.
7. **Terminal tiles need time to initialize**: after `tile create term`, wait a few seconds before `terminal write` so the PTY session can start.

## Setup

The `qf-canvas` CLI is installed to `~/.local/bin/`. If the command is not found, the user needs to add it to their PATH:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Add this to `~/.zshrc` (macOS) or `~/.bashrc` (Linux) to persist across sessions.

## Exit Codes

| Code | Meaning                                    |
|------|--------------------------------------------|
| 0    | Success                                    |
| 1    | RPC error (tile not found, invalid params) |
| 2    | Connection failure (QuantFlow not running) |
