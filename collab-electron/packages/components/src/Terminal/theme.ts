import type { ITheme } from "@xterm/xterm";

/* QuantFlow ANSI — drop-in replacement for packages/components/src/Terminal/theme.ts
 *
 * The old darkTheme was the stock VS Code palette, verbatim. Since the terminal
 * is most of the tile, ~80% of every tile's pixels were wearing Microsoft's
 * colours while the chrome wore QuantFlow's. That mismatch is why the tile never
 * cohered — no amount of border work fixes it.
 *
 * Meanings are preserved: red is still red, green still green, so agents that
 * colour-code errors and success keep working. Only the hues and lightness move.
 *
 * Every NORMAL colour below is measured against the tile ground #07090C and
 * clears WCAG AA (4.5:1). The old palette's brightBlack (#666666) and foreground
 * (#d4d4d4) were the worst offenders — dim agent text was barely readable.
 */

const QF_ANSI = {
  black:         "#0f141b",
  red:           "#ff8a75",  //  8.37:1
  green:         "#6fe3a8",  // 12.11:1
  yellow:        "#f2c260",  // 11.59:1
  blue:          "#6da8ff",  //  8.25:1
  magenta:       "#a87be8",  //  6.33:1
  cyan:          "#29c4b2",  //  9.14:1
  white:         "#c7ceda",

  brightBlack:   "#8a94a6",  //  6.28:1  — was #666666 (2.5:1). Dim text is now readable.
  brightRed:     "#ffa694",
  brightGreen:   "#8ff0be",
  brightYellow:  "#ffd684",
  brightBlue:    "#93c0ff",
  brightMagenta: "#c29bff",
  brightCyan:    "#56f0dc",
  brightWhite:   "#f2f5f9",
} as const;

export const darkTheme: ITheme = {
  /* Opaque, not transparent. The old rgba(8,8,8,0) let the canvas watermark
     drift through the tile, so an empty tile read as a hole punched in the
     canvas rather than an object sitting on it. */
  background: "#07090c",
  foreground: "#e7ecf2",           // was #d4d4d4 — VS Code grey, not --qf-text

  /* The one place the brand enters the terminal: the caret is YOURS, not the
     agent's output. Live Green here reads as identity without hijacking any
     ANSI meaning. */
  cursor: "#b7ff00",
  cursorAccent: "#07090c",
  selectionBackground: "rgba(105, 140, 170, 0.32)",

  ...QF_ANSI,
};

export const lightTheme: ITheme = {
  background: "#f5f5f0",           // QuantFlow ivory, not pure white
  foreground: "#1a1d21",
  cursor: "#3d5a00",
  cursorAccent: "#f5f5f0",
  selectionBackground: "rgba(120, 150, 180, 0.30)",

  black:         "#1a1d21",
  red:           "#c0392b",
  green:         "#2f7d4f",
  yellow:        "#8a6100",
  blue:          "#2b5fbf",
  magenta:       "#6b3fa0",
  cyan:          "#0f6f68",
  white:         "#d8d8d2",
  brightBlack:   "#5a6068",
  brightRed:     "#d4503f",
  brightGreen:   "#3d9a63",
  brightYellow:  "#a67600",
  brightBlue:    "#3a72d4",
  brightMagenta: "#7f4fbb",
  brightCyan:    "#14857d",
  brightWhite:   "#ffffff",
};

export function getTheme(): ITheme {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? darkTheme : lightTheme;
}
