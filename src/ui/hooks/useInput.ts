import { useEffect, useRef, useState } from "react";
import { InputManager } from "../../engine/input";
import type { ActionState } from "../../engine/input/ActionTypes";

export interface UseInputResult {
  actions: ActionState;
  updateActions: () => void;
}

export function useInput(): UseInputResult {
  const managerRef = useRef<InputManager>(new InputManager());
  const [actions, setActions] = useState(managerRef.current.actions);

  useEffect(() => {
    const onDown = (e: KeyboardEvent): void => {
      managerRef.current.enqueueKeyDown(e.code);
    };
    const onUp = (e: KeyboardEvent): void => {
      managerRef.current.enqueueKeyUp(e.code);
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return (): void => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  function updateActions(): void {
    setActions(managerRef.current.updateActions());
  }

  return { actions, updateActions };
}
