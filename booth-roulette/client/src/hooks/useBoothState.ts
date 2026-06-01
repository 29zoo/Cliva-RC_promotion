import { useCallback, useEffect, useState } from "react";
import { fetchBoothState, saveBoothState } from "../lib/api";
import { DEFAULT_STOCK } from "../lib/products";
import type { BoothState, ProductId, VipEntry } from "../types/booth";

const LOCAL_KEY = "booth_state_v3";

function loadLocal(): BoothState | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BoothState;
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
    stock: { ...DEFAULT_STOCK },
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
        await saveBoothState(next);
        setSyncError(null);
      } catch {
        setSyncError("서버 동기화 실패 — 로컬에만 저장되었습니다.");
      }
    },
    [applyState],
  );

  const updateStock = useCallback(
    (productId: ProductId, count: number) => {
      void persist({ ...state, stock: { ...state.stock, [productId]: count } });
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
    updateStock,
    setVipList,
    resetParticipants,
  };
}
