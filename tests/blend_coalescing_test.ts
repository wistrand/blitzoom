// BlitZoomCanvas._blend scheduling.
//
// Blends must never overlap (the GPU path awaits mapAsync mid-blend) and must
// never be dropped: a call made while a blend is in flight schedules one
// follow-up blend that covers the newer state. Regression — the old early-
// return guard silently skipped such calls, leaving a mutation's new nodes or a
// mid-blend strength change unblended.
//
// The scheduling logic only touches `this._blendPromise` / `_blendRerun` /
// `_blendRerunFast` / `_blendInner`, so these tests call the real method on a
// stand-in object with a stubbed `_blendInner` (a real canvas needs a DOM).

import { assert, assertEquals } from "https://deno.land/std/assert/mod.ts";

import { BlitZoomCanvas } from "../docs/blitzoom-canvas.js";

const _blend = (BlitZoomCanvas as any).prototype._blend;
const tick = () => new Promise((r) => setTimeout(r, 5));

interface Stub {
  calls: boolean[];
  state: number;
  seenState: number[];
  _blendPromise: Promise<void> | null;
  _blendRerun: Promise<void> | null;
  _blendRerunFast?: boolean;
  _blendInner: (fast: boolean) => Promise<void>;
  _blend: (fast?: boolean) => Promise<void>;
}

function stub(): Stub {
  const o = {
    calls: [] as boolean[], state: 0, seenState: [] as number[],
    _blendPromise: null, _blendRerun: null,
  } as Stub;
  o._blendInner = async (fast: boolean) => {
    o.calls.push(fast);
    o.seenState.push(o.state);
    await tick();
  };
  o._blend = (fast = false) => _blend.call(o, fast);
  return o;
}

Deno.test("_blend: awaited calls run one blend each", async () => {
  const o = stub();
  await o._blend(false);
  await o._blend(false);
  assertEquals(o.calls.length, 2);
});

Deno.test("_blend: overlapping calls collapse into one follow-up blend", async () => {
  const o = stub();
  await Promise.all([o._blend(false), o._blend(false), o._blend(false)]);
  assertEquals(o.calls.length, 2, "in-flight blend plus a single follow-up");
  assertEquals(o._blendPromise, null, "no blend left in flight");
  assertEquals(o._blendRerun, null, "no follow-up left scheduled");
});

Deno.test("_blend: the follow-up sees state changed during the in-flight blend", async () => {
  const o = stub();
  o.state = 1;
  const first = o._blend(false);
  o.state = 2; // e.g. a strength drag or a mutation's new nodes
  const second = o._blend(false);
  await Promise.all([first, second]);
  assertEquals(o.seenState, [1, 2]);
});

Deno.test("_blend: a full request upgrades a coalesced fast follow-up", async () => {
  const o = stub();
  await Promise.all([o._blend(true), o._blend(true), o._blend(false)]);
  assertEquals(o.calls[1], false, "follow-up runs full");
});

Deno.test("_blend: an all-fast burst stays fast", async () => {
  const o = stub();
  await Promise.all([o._blend(true), o._blend(true)]);
  assertEquals(o.calls[1], true);
});

Deno.test("_blend: a failed blend rejects its caller but doesn't wedge later blends", async () => {
  const o = stub();
  const boom = new Error("blend failed");
  o._blendInner = async () => {
    o._blendInner = async (fast: boolean) => { o.calls.push(fast); await tick(); };
    throw boom;
  };

  const failed = await o._blend(false).then(() => "resolved", (e) => e);
  assertEquals(failed, boom);

  await o._blend(false);
  assertEquals(o.calls.length, 1, "later blends still run");
});

Deno.test("_blend: a follow-up still runs when the in-flight blend rejects", async () => {
  const o = stub();
  o._blendInner = async () => { await tick(); throw new Error("blend failed"); };
  const failing = o._blend(false).catch(() => {});
  o._blendInner = async (fast: boolean) => { o.calls.push(fast); await tick(); };
  const queued = o._blend(false);

  await Promise.all([failing, queued]);
  assertEquals(o.calls.length, 1);
});

Deno.test("_blend: blends never overlap", async () => {
  const o = stub();
  let running = 0, maxConcurrent = 0;
  o._blendInner = async (fast: boolean) => {
    running++;
    maxConcurrent = Math.max(maxConcurrent, running);
    o.calls.push(fast);
    await tick();
    running--;
  };
  await Promise.all([o._blend(false), o._blend(false), o._blend(true), o._blend(false)]);
  assertEquals(maxConcurrent, 1);
});
