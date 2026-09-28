import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

// Reproduce a mobile browser whose first resume remains pending until a later tap.
const parameter = () => ({value: 0, setValueAtTime() {}, setTargetAtTime() {}, cancelScheduledValues() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}});
const node = () => ({connect() {}, disconnect() {}, gain: parameter()});
const contexts = [], sources = [], listeners = new Map(), cleanup = [];
let gestureAllowed = false;
class MobileAudioContext {
  state = 'suspended'; currentTime = 0; sampleRate = 44100; destination = node(); resumeCalls = 0;
  pending = [];
  constructor() { contexts.push(this); }
  resume() {
    this.resumeCalls++;
    if (!gestureAllowed) return new Promise(resolve => this.pending.push(resolve));
    this.state = 'running'; this.onstatechange?.();
    for (const resolve of this.pending.splice(0)) resolve();
    return Promise.resolve();
  }
  createGain() { return node(); }
  createDynamicsCompressor() { return {...node(), threshold: parameter(), knee: parameter(), ratio: parameter()}; }
  createBuffer(channels, length) { return {prime: true, length}; }
  createBufferSource() {
    const source = {...node(), buffer: null, started: false, stopped: false,
      start() { this.started = true; }, stop() { this.stopped = true; }};
    sources.push(source); return source;
  }
  decodeAudioData() { return Promise.resolve({duration: 12}); }
  close() { this.state = 'closed'; return Promise.resolve(); }
}
globalThis.window = {AudioContext: MobileAudioContext, addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name)};
globalThis.document = {hidden: false, addEventListener() {}, removeEventListener() {}};
const storage = new Map();
globalThis.localStorage = {getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value)};
let fetches = 0;
globalThis.fetch = async () => { fetches++; return {ok: true, arrayBuffer: async () => new ArrayBuffer(4)}; };

const dataModule = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const transpile = path => ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext}}).outputText;
// A tiny hook harness keeps actual callbacks and refs while avoiding a DOM dependency.
globalThis.audioTestEffects = [];
const react = dataModule(`export const useRef=value=>({current:value}); export const useState=value=>[value,()=>{}]; export const useCallback=fn=>fn; export const useEffect=fn=>globalThis.audioTestEffects.push(fn);`);
const engine = dataModule(transpile('../lib/stadium-audio.ts'));
const hook = dataModule(transpile('../hooks/use-stadium-audio.ts').replace("from 'react'", `from '${react}'`).replace("from '@/lib/stadium-audio'", `from '${engine}'`));
const {useStadiumAudio} = await import(hook);
const controls = useStadiumAudio(null, 0, undefined, false);
for (const effect of globalThis.audioTestEffects) { const dispose = effect(); if (dispose) cleanup.push(dispose); }
const flush = () => new Promise(resolve => setImmediate(resolve));
const gesture = {target: {closest: () => null}};
assert.equal(listeners.has('pointerdown'), false, 'Do not unlock prematurely on touch pointerdown');
listeners.get('touchend')(gesture); await flush();
assert.equal(contexts[0].state, 'suspended');
assert.equal(contexts[0].resumeCalls, 1);
gestureAllowed = true;
controls.toggle(); await flush();
assert.ok(contexts[0].resumeCalls >= 2, 'The button must retry resume while an earlier attempt is pending');
assert.equal(contexts[0].state, 'running');
assert.equal(fetches, 3, 'Repeated taps share audio downloads');
assert.ok(sources.some(source => source.buffer?.duration && source.started), 'Enabling in the lobby previews the crowd');
controls.toggle();
assert.equal(storage.get('pd-sound'), 'off');
assert.ok(sources.filter(source => source.buffer?.duration).every(source => source.stopped), 'Mute stops the preview');
const resumeCalls = contexts[0].resumeCalls;
listeners.get('click')(gesture); await flush();
assert.equal(contexts[0].resumeCalls, resumeCalls, 'Ordinary taps must respect a saved mute');
// A suspended/interrupted context must resume, rather than interpreting the tap as mute.
controls.toggle(); await flush();
contexts[0].state = 'suspended'; contexts[0].onstatechange?.();
controls.toggle(); await flush();
assert.equal(contexts[0].state, 'running');
assert.equal(storage.get('pd-sound'), 'on');
for (const dispose of cleanup) dispose();
assert.equal(contexts[0].state, 'closed');
console.log('PASS: blocked mobile resume recovers on next tap; shared loading; lobby preview; mute; interruption recovery; cleanup');
