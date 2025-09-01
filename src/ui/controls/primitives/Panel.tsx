import type { HTMLAttributes, JSX } from "react";

type PanelProps = HTMLAttributes<HTMLDivElement>;

export function Panel({ className, ...rest }: PanelProps): JSX.Element {
  const classes = ["hud-panel", className].filter(Boolean).join(" ");
  return <div className={classes} {...rest} />;
}
