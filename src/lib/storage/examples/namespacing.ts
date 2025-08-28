import { createStore, detectBackend, numberCodec } from "..";

const backend = detectBackend();
const scores = createStore<number>({ namespace: "scores", backend, codec: numberCodec });
const prefs = createStore<number>({ namespace: "prefs", backend, codec: numberCodec });

scores.set("level1", 12345);
prefs.set("ui-scale", 2);

console.log("scores keys:", scores.keys()); // ["level1"]
console.log("prefs keys:", prefs.keys()); // ["ui-scale"]

scores.clear();
console.log("after clear scores:", scores.keys()); // []
console.log("prefs still intact:", prefs.keys()); // ["ui-scale"]
