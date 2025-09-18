import type { JSX, PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { GameController } from "../../../application/GameAPI";
import type { Action } from "../../../application/input/ActionTypes";

interface TouchControlsOverlayProps {
  controller: GameController | null;
  mode: "space" | "planet" | "ship";
  spaceHeading: number;
}

type ActionSetter = (action: Action, pressed: boolean) => void;

interface TouchButtonProps {
  action: Action;
  label: string;
  setAction: ActionSetter;
  className?: string;
}

const DIRECTIONAL_ACTIONS: readonly Action[] = ["thrust", "moveDown", "turnLeft", "turnRight"];

function TouchButton({ action, label, setAction, className }: TouchButtonProps): JSX.Element {
  const activePointers = useRef<Set<number>>(new Set());

  const release = useCallback((): void => {
    if (activePointers.current.size === 0) return;
    activePointers.current.clear();
    setAction(action, false);
  }, [action, setAction]);

  useEffect(() => release, [release]);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>): void => {
      event.preventDefault();
      if (!activePointers.current.has(event.pointerId)) {
        activePointers.current.add(event.pointerId);
        if (activePointers.current.size === 1) setAction(action, true);
      }
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [action, setAction],
  );

  const onPointerUpOrCancel = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>): void => {
      if (!activePointers.current.has(event.pointerId)) return;
      activePointers.current.delete(event.pointerId);
      event.currentTarget.releasePointerCapture(event.pointerId);
      if (activePointers.current.size === 0) setAction(action, false);
    },
    [action, setAction],
  );

  return (
    <button
      type="button"
      className={`hud-panel flex items-center justify-center text-xs font-semibold uppercase tracking-wide select-none touch-none ${className ?? ""}`}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUpOrCancel}
      onPointerCancel={onPointerUpOrCancel}
      aria-label={label}
    >
      {label}
    </button>
  );
}

interface TouchJoystickProps {
  setAction: ActionSetter;
  mode: "space" | "planet" | "ship";
  spaceHeading: number;
}

const JOYSTICK_THRESHOLD = 14;
const JOYSTICK_MAX_DISTANCE = 48;
const TURN_ALIGNMENT_TOLERANCE = 0.12; // ~7 degrees
const REVERSE_THRESHOLD = Math.PI - TURN_ALIGNMENT_TOLERANCE;

function normalizeAngle(angle: number): number {
  let value = angle;
  while (value <= -Math.PI) value += Math.PI * 2;
  while (value > Math.PI) value -= Math.PI * 2;
  return value;
}

function TouchJoystick({ setAction, mode, spaceHeading }: TouchJoystickProps): JSX.Element {
  const activePointer = useRef<number | null>(null);
  const origin = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const baseRef = useRef<HTMLDivElement | null>(null);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastVector = useRef<{ dx: number; dy: number } | null>(null);

  const releaseDirections = useCallback((): void => {
    for (const action of DIRECTIONAL_ACTIONS) setAction(action, false);
    activePointer.current = null;
    setOffset({ x: 0, y: 0 });
    lastVector.current = null;
  }, [setAction]);

  useEffect(() => releaseDirections, [releaseDirections]);

  const applyMovement = useCallback(
    (dx: number, dy: number): void => {
      lastVector.current = { dx, dy };
      const distance = Math.hypot(dx, dy);
      const limit = distance > 0 ? Math.min(distance, JOYSTICK_MAX_DISTANCE) : 0;
      const scale = distance > 0 ? limit / distance : 0;
      const clampedX = dx * scale;
      const clampedY = dy * scale;
      setOffset({ x: clampedX, y: clampedY });

      const isActive = distance > JOYSTICK_THRESHOLD;

      if (!isActive) {
        for (const action of DIRECTIONAL_ACTIONS) setAction(action, false);
        return;
      }

      if (mode === "space") {
        const targetAngle = Math.atan2(dy, dx);
        const diff = normalizeAngle(targetAngle - spaceHeading);
        const absDiff = Math.abs(diff);
        const aligned = absDiff <= TURN_ALIGNMENT_TOLERANCE;
        const reverseRequested = absDiff >= REVERSE_THRESHOLD;

        setAction("turnLeft", diff < -TURN_ALIGNMENT_TOLERANCE);
        setAction("turnRight", diff > TURN_ALIGNMENT_TOLERANCE);

        if (reverseRequested) {
          setAction("thrust", false);
          setAction("moveDown", true);
        } else {
          setAction("thrust", true);
          setAction("moveDown", false);
        }

        if (aligned) {
          setAction("turnLeft", false);
          setAction("turnRight", false);
        }
        return;
      }

      setAction("thrust", dy < -JOYSTICK_THRESHOLD);
      setAction("moveDown", dy > JOYSTICK_THRESHOLD);
      setAction("turnLeft", dx < -JOYSTICK_THRESHOLD);
      setAction("turnRight", dx > JOYSTICK_THRESHOLD);
    },
    [mode, setAction, spaceHeading],
  );

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>): void => {
      event.preventDefault();
      if (activePointer.current != null) return;
      activePointer.current = event.pointerId;
      const base = baseRef.current;
      if (!base) return;
      base.setPointerCapture(event.pointerId);
      const rect = base.getBoundingClientRect();
      origin.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      const dx = event.clientX - origin.current.x;
      const dy = event.clientY - origin.current.y;
      applyMovement(dx, dy);
    },
    [applyMovement],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>): void => {
      if (activePointer.current !== event.pointerId) return;
      const dx = event.clientX - origin.current.x;
      const dy = event.clientY - origin.current.y;
      applyMovement(dx, dy);
    },
    [applyMovement],
  );

  const onPointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>): void => {
      if (activePointer.current !== event.pointerId) return;
      baseRef.current?.releasePointerCapture(event.pointerId);
      releaseDirections();
    },
    [releaseDirections],
  );

  useEffect(() => {
    if (activePointer.current == null) return;
    const vector = lastVector.current;
    if (!vector) return;
    applyMovement(vector.dx, vector.dy);
  }, [applyMovement, mode, spaceHeading]);

  return (
    <div
      ref={baseRef}
      className="relative w-32 h-32 rounded-full border border-hud-accent/40 bg-hud-bg/70 backdrop-blur-sm flex items-center justify-center touch-none select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      aria-label="Movement joystick"
    >
      <div className="absolute inset-4 rounded-full border border-hud-accent/30" />
      <div
        className="absolute w-16 h-16 rounded-full bg-hud-accent/60 border border-white/40 shadow-lg"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      />
    </div>
  );
}

export function TouchControlsOverlay({
  controller,
  mode,
  spaceHeading,
}: TouchControlsOverlayProps): JSX.Element {
  const pressedRef = useRef<Map<Action, boolean>>(new Map());

  const releaseAll = useCallback((): void => {
    if (controller) {
      for (const [action, pressed] of pressedRef.current.entries()) {
        if (pressed) controller.dispatch(action, false);
      }
    }
    pressedRef.current.clear();
  }, [controller]);

  useEffect(() => releaseAll, [releaseAll]);

  const setAction = useCallback(
    (action: Action, pressed: boolean): void => {
      if (!controller) return;
      const prev = pressedRef.current.get(action) ?? false;
      if (prev === pressed) return;
      pressedRef.current.set(action, pressed);
      controller.dispatch(action, pressed);
    },
    [controller],
  );

  const showLand = mode === "space";
  const showTakeoff = mode === "planet";

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      <div className="absolute left-4 bottom-4 pointer-events-auto">
        <TouchJoystick setAction={setAction} mode={mode} spaceHeading={spaceHeading} />
      </div>
      <div className="absolute right-4 bottom-4 pointer-events-auto flex flex-col items-end gap-3">
        <TouchButton
          action="fire"
          label="Fire"
          setAction={setAction}
          className="w-24 h-24 text-base"
        />
        <div className="flex gap-2">
          <TouchButton
            action="interact"
            label="Interact"
            setAction={setAction}
            className="w-20 h-20 text-[11px]"
          />
          {showLand ? (
            <TouchButton
              action="land"
              label="Land"
              setAction={setAction}
              className="w-16 h-16 text-[11px]"
            />
          ) : null}
          {showTakeoff ? (
            <TouchButton
              action="takeoff"
              label="Takeoff"
              setAction={setAction}
              className="w-16 h-16 text-[11px]"
            />
          ) : null}
        </div>
        <div className="flex gap-2">
          <TouchButton
            action="boost"
            label="Boost"
            setAction={setAction}
            className="w-16 h-16 text-[11px]"
          />
          <TouchButton
            action="board"
            label="Board"
            setAction={setAction}
            className="w-16 h-16 text-[11px]"
          />
        </div>
      </div>
    </div>
  );
}
