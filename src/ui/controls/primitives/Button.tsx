import type { ButtonHTMLAttributes, JSX } from "react";

type ButtonVariant = "default" | "danger" | "ghost";
type ButtonSize = "xs" | "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

function sizeClasses(size: ButtonSize): string {
  switch (size) {
    case "md":
      return "text-sm px-3 py-2";
    case "sm":
      return "text-xs px-2.5 py-1.5";
    default:
      return "text-xs px-2 py-1";
  }
}

export function Button({
  variant = "default",
  size = "xs",
  className,
  ...rest
}: ButtonProps): JSX.Element {
  const variantClass =
    variant === "danger"
      ? "hud-btn-danger"
      : variant === "ghost"
        ? "font-hud border border-hud-accent/20 rounded bg-transparent text-slate-100 hover:bg-hud-bg/50 transition-colors"
        : "hud-btn";
  const classes = [variantClass, sizeClasses(size), className].filter(Boolean).join(" ");
  return <button className={classes} {...rest} />;
}
