import { monitorEventLoopDelay } from 'node:perf_hooks';

// Event-loop delay over the last 10 s window, reported by /health. Every room, save and login shares this one loop, so
// a growing p99 is the first sign the machine is overloaded (docs/ops/DEPLOYMENT.md, load test).
const histogram = monitorEventLoopDelay({ resolution: 10 });
histogram.enable();
let window = { p50: 0, p99: 0, max: 0 };
const ms = (ns: number) => Math.round(ns / 1e5) / 10;
setInterval(() => {
  window = { p50: ms(histogram.percentile(50)), p99: ms(histogram.percentile(99)), max: ms(histogram.max) };
  histogram.reset();
}, 10_000).unref();

export function loopDelay() { return { ...window }; }
export function memoryMb() { return Math.round(process.memoryUsage().rss / 1048576); }
