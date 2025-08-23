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
}) {
  const loopRef = useRef<GameLoop | null>(null);

  useEffect(() => {
    const loop = new GameLoop({ update, render });
    loopRef.current = loop;
    loop.start();
    return () => loop.stop();
  }, [update, render]);

  return <>{children}</>;
}
