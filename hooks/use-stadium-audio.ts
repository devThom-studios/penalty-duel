'use client';
import {useCallback, useEffect, useRef, useState} from 'react';
import {StadiumAudio, type StadiumMode} from '@/lib/stadium-audio';
import type {DuelView} from '@/lib/penalty';

export function useStadiumAudio(game: DuelView | null, now: number, room: string | undefined, network: boolean) {
  const engine = useRef<StadiumAudio | null>(null);
  const wantsSound = useRef(true), attempt = useRef(0);
  const mode = useRef<StadiumMode>('idle');
  const cues = useRef({room: '', kick: '', reaction: ''});
  const [loading, setLoading] = useState(false);
  const [muted, setMuted] = useState(false), [ready, setReady] = useState(false), [failed, setFailed] = useState(false);
  mode.current = !game || game.phase === 'lobby' ? 'idle' : game.paused || network ? 'paused' : game.phase;

  const enable = useCallback(async (preview = false) => {
    if (!wantsSound.current || (!preview && engine.current?.isReady)) return;
    const request = ++attempt.current;
    setLoading(true); setFailed(false);
    let sound: StadiumAudio | null = null;
    try {
      if (!engine.current) engine.current = new StadiumAudio(setReady);
      sound = engine.current;
      sound.setMode(mode.current); sound.setVisible(!document.hidden);
      // No pending guard: another genuine tap must always be able to unlock audio.
      await sound.enable();
      if (engine.current !== sound || attempt.current !== request) return;
      if (!wantsSound.current) { sound.mute(); return; }
      setReady(sound.isReady); setFailed(false);
      if (preview) sound.preview();
    } catch {
      if (attempt.current !== request || (sound && engine.current !== sound)) return;
      // A newer gesture may have started playback while this attempt timed out.
      if (sound?.isReady) { setReady(true); return; }
      sound?.mute(); setReady(false); setFailed(true);
    } finally { if (attempt.current === request) setLoading(false); }
  }, []);

  useEffect(() => {
    try { wantsSound.current = localStorage.getItem('pd-sound') !== 'off'; } catch {}
    setMuted(!wantsSound.current);
    const unlock = (event: Event) => {
      // The sound button handles its own gesture, so it never toggles twice.
      if ((event.target as Element)?.closest?.('[data-stadium-sound]')) return;
      void enable();
    };
    const visibility = () => engine.current?.setVisible(!document.hidden);
    window.addEventListener('touchend', unlock, {passive: true});
    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('touchend', unlock); window.removeEventListener('click', unlock); window.removeEventListener('keydown', unlock);
      document.removeEventListener('visibilitychange', visibility);
      ++attempt.current; engine.current?.dispose(); engine.current = null;
    };
  }, [enable]);

  useEffect(() => { engine.current?.setMode(mode.current); }, [game?.phase, game?.paused, network]);
  useEffect(() => {
    if (cues.current.room !== room) cues.current = {room: room || '', kick: '', reaction: ''};
    if (!game?.last || (game.phase !== 'reveal' && game.phase !== 'finished')) return;
    const elapsed = (now - game.revealAt) / 1000;
    const key = `${game.gameNumber}-${game.last.turn}`;
    // Mark even muted/hidden cues as seen: reconnecting never replays an old goal.
    if (elapsed >= .5 && cues.current.kick !== key) {
      cues.current.kick = key;
      if (elapsed < .9 && !game.paused && !network) engine.current?.kick();
    }
    if (elapsed >= 1.55 && cues.current.reaction !== key) {
      cues.current.reaction = key;
      if (elapsed < 2.6 && !game.paused && !network) engine.current?.react(game.last.outcome === 'goal');
    }
  }, [game, now, room, network]);

  const toggle = useCallback(() => {
    if (wantsSound.current && engine.current?.isReady) {
      wantsSound.current = false; ++attempt.current; setLoading(false); engine.current?.mute(); setMuted(true); setReady(false);
      try { localStorage.setItem('pd-sound', 'off'); } catch {}
    } else {
      wantsSound.current = true; setMuted(false); setFailed(false);
      try { localStorage.setItem('pd-sound', 'on'); } catch {}
      void enable(true);
    }
  }, [enable]);
  return {soundOn: !muted && ready, label: muted ? 'Sound off' : ready ? 'Sound on' : loading ? 'Starting sound…' : failed ? 'Retry sound' : 'Enable sound', toggle};
}
