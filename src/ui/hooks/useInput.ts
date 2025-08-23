import { useEffect, useRef, useState } from "react";
import { InputManager } from "../../application/game/inputManager";

export function useInput() {
  const managerRef = useRef<InputManager>(new InputManager());
  const [actions, setActions] = useState(managerRef.current.actions);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      managerRef.current.enqueueKeyDown(e.code);
    };
    const onUp = (e: KeyboardEvent) => {
      managerRef.current.enqueueKeyUp(e.code);
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  function updateActions() {
    setActions(managerRef.current.updateActions());
  }

  return { actions, updateActions };
}
