import type { JSX } from "react";
import { useEffect, useRef } from "react";
import { GameLoop } from "../../application/game/loop";

export function GameLoopProvider({
  update,
  render,
  children,
}: {
  update: (dt: number) => void;
  render: () => void;
  children: React.ReactNode;
}): JSX.Element {
  const loopRef = useRef<GameLoop | null>(null);

  useEffect(() => {
    const loop = new GameLoop({ update, render });
    loopRef.current = loop;
    loop.start();
    return (): void => loop.stop();
  }, [update, render]);

  return <>{children}</>;
}
