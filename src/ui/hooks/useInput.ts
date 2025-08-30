import { useEffect, useRef, useState } from "react";

import { InputManager } from "../../application/input";
import type { ActionState } from "../../application/input/ActionTypes";

export interface UseInputResult {
  actions: ActionState;
  updateActions: () => void;
}

export function useInput(): UseInputResult {
  const managerRef = useRef<InputManager>(new InputManager());
  const [actions, setActions] = useState(managerRef.current.actions);

  useEffect(() => {
    const onDown = (event: KeyboardEvent): void => {
      managerRef.current.enqueueKeyDown(event.code);
    };
    const onUp = (event: KeyboardEvent): void => {
      managerRef.current.enqueueKeyUp(event.code);
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
