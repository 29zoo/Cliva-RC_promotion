import { useCallback, useEffect, useState } from "react";
import { fetchBoothState, saveBoothState } from "../lib/api";
import { DEFAULT_PRIZES, DEFAULT_WHEEL_SEGMENT_COUNT } from "../lib/wheel";
import type { BoothState, Prize, VipEntry } from "../types/booth";

const LOCAL_KEY = "booth_state_v4";

function loadLocal(): BoothState | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BoothState;
    if (!parsed.prizes?.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveLocal(state: BoothState) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function useBoothState() {
  const [state, setState] = useState<BoothState>({
    wheelSegmentCount: DEFAULT_WHEEL_SEGMENT_COUNT,
    prizes: [...DEFAULT_PRIZES],
    vipList: [],
    participants: [],
  });
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  const applyState = useCallback((next: BoothState) => {
    setState(next);
    saveLocal(next);
  }, []);

  const refreshState = useCallback(async () => {
    const remote = await fetchBoothState();
    applyState(remote);
    setSyncError(null);
    return remote;
  }, [applyState]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const local = loadLocal();
      if (local) setState(local);

      try {
        const remote = await fetchBoothState();
        if (!cancelled) applyState(remote);
      } catch {
        if (!cancelled && !local) {
          setSyncError("서버 연결 실패 — 일부 기능이 제한될 수 있습니다.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyState]);

  const persist = useCallback(
    async (next: BoothState) => {
      applyState(next);
      try {
        const saved = await saveBoothState(next);
        applyState(saved);
        setSyncError(null);
      } catch (err) {
        setSyncError(err instanceof Error ? err.message : "서버 동기화 실패 — 로컬에만 저장되었습니다.");
        throw err;
      }
    },
    [applyState],
  );

  const savePrizeConfig = useCallback(
    (wheelSegmentCount: number, prizes: Prize[]) => {
      return persist({ ...state, wheelSegmentCount, prizes });
    },
    [persist, state],
  );

  const setVipList = useCallback(
    (vipList: VipEntry[]) => {
      void persist({ ...state, vipList });
    },
    [persist, state],
  );

  const resetParticipants = useCallback(() => {
    void persist({ ...state, participants: [] });
  }, [persist, state]);

  return {
    state,
    loading,
    syncError,
    refreshState,
    applyState,
    savePrizeConfig,
    setVipList,
    resetParticipants,
  };
}
