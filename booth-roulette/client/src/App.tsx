import { useCallback, useMemo, useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { ResultModal } from "./components/ResultModal";
import { useBoothState } from "./hooks/useBoothState";
import { registerParticipant, savePrizeResult, saveQuizResult } from "./lib/api";
import { pickRandomQuiz } from "./lib/quiz";
import { buildWheelSegments, pickPrizeByStock } from "./lib/wheel";
import { findVipMatch } from "./lib/vip";
import { AdminScreen } from "./screens/AdminScreen";
import { InfoInputScreen } from "./screens/InfoInputScreen";
import { QuizScreen } from "./screens/QuizScreen";
import { RouletteScreen } from "./screens/RouletteScreen";
import { VideoScreen } from "./screens/VideoScreen";
import { VipThankYouScreen } from "./screens/VipThankYouScreen";
import { WelcomeScreen } from "./screens/WelcomeScreen";
import type { JobType, Prize, QuizQuestion, ScreenName, SessionParticipant } from "./types/booth";

function resetSession() {
  return {
    name: "",
    affiliation: "",
    jobType: "" as JobType | "",
    phone: "",
  };
}

export default function App() {
  const { state, loading, syncError, refreshState, applyState, savePrizeConfig, setVipList, resetParticipants } =
    useBoothState();

  const [screen, setScreen] = useState<ScreenName>("welcome");
  const [form, setForm] = useState(resetSession);
  const [session, setSession] = useState<SessionParticipant | null>(null);
  const [quizQuestion, setQuizQuestion] = useState<QuizQuestion | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [spinning, setSpinning] = useState(false);
  const [spinTarget, setSpinTarget] = useState<number | null>(null);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [resultProduct, setResultProduct] = useState<Prize | null>(null);
  const [resultOpen, setResultOpen] = useState(false);

  const wheelSegments = useMemo(
    () => buildWheelSegments(state.prizes, state.wheelSegmentCount),
    [state.prizes, state.wheelSegmentCount],
  );

  const stockByProduct = useMemo(
    () => Object.fromEntries(state.prizes.map((p) => [p.id, p.stock])),
    [state.prizes],
  );

  const vipCount = useMemo(() => state.participants.filter((p) => p.isVip && p.completedAt).length, [state.participants]);

  const previewVip = useMemo(
    () => findVipMatch(state.vipList, form.name.trim(), form.affiliation.trim()),
    [state.vipList, form.name, form.affiliation],
  );

  const navigate = useCallback((name: ScreenName) => {
    setScreen(name);
    window.scrollTo(0, 0);
    if (name === "roulette") {
      setSpinTarget(null);
      setCurrentRotation(0);
    }
    if (name === "info") {
      setFormError(null);
    }
  }, []);

  const goHome = useCallback(() => {
    setSession(null);
    setQuizQuestion(null);
    setForm(resetSession());
    setResultProduct(null);
    setResultOpen(false);
    setSpinTarget(null);
    setCurrentRotation(0);
    navigate("welcome");
  }, [navigate]);

  const submitInfo = useCallback(async () => {
    const name = form.name.trim();
    const affiliation = form.affiliation.trim();
    const jobType = form.jobType;
    const phone = form.phone.trim();

    if (!name || !jobType || phone.replace(/\D/g, "").length < 9) return;

    setSubmitting(true);
    setFormError(null);
    try {
      const res = await registerParticipant({ name, affiliation, jobType, phone });
      await refreshState();
      setSession({
        id: res.participant.id!,
        name: res.participant.name,
        affiliation: res.participant.affiliation,
        jobType: res.participant.jobType,
        phone: res.participant.phone,
        isVip: res.isVip,
      });
      navigate("video");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }, [form, navigate, refreshState]);

  const startQuiz = useCallback(() => {
    setQuizQuestion(pickRandomQuiz());
    navigate("quiz");
  }, [navigate]);

  const submitQuiz = useCallback(
    async (_selectedIndex: number, correct: boolean) => {
      if (!session || !quizQuestion) return;
      setSubmitting(true);
      try {
        await saveQuizResult(session.id, quizQuestion.id, correct);
        await refreshState();
        navigate("roulette");
      } catch {
        alert("퀴즈 결과 저장에 실패했습니다. 다시 시도해주세요.");
      } finally {
        setSubmitting(false);
      }
    },
    [navigate, quizQuestion, refreshState, session],
  );

  const spin = useCallback(async () => {
    if (spinning || !session) return;

    const picked = pickPrizeByStock(state.prizes);
    if (!picked) {
      alert("모든 경품이 소진되었습니다.");
      return;
    }

    setSpinning(true);

    const matchingSlots = wheelSegments.filter((s) => s.productId === picked.id);
    const slot = matchingSlots[Math.floor(Math.random() * matchingSlots.length)]!;
    const inset = slot.sweep * 0.15;
    const targetCenter = slot.start + inset + Math.random() * (slot.sweep - 2 * inset);
    const extraRotations = 5;
    const targetAngle = 360 - targetCenter;
    const nextRotation = currentRotation + extraRotations * 360 + (targetAngle - (currentRotation % 360));

    setSpinTarget(nextRotation);
    setCurrentRotation(nextRotation);

    setTimeout(async () => {
      try {
        const newState = await savePrizeResult(session.id, picked.name, picked.id);
        applyState(newState);
        setResultProduct(picked);
        setResultOpen(true);
      } catch (err) {
        alert(err instanceof Error ? err.message : "당첨 저장에 실패했습니다.");
      } finally {
        setSpinning(false);
      }
    }, 5100);
  }, [applyState, currentRotation, session, spinning, state.prizes, wheelSegments]);

  const finishPrize = useCallback(() => {
    setResultOpen(false);
    if (session?.isVip && resultProduct) {
      navigate("vip-thankyou");
    } else {
      goHome();
    }
  }, [goHome, navigate, resultProduct, session?.isVip]);

  const exportCsv = useCallback(() => {
    const completed = state.participants.filter((p) => p.completedAt);
    if (completed.length === 0) {
      alert("내보낼 데이터가 없습니다");
      return;
    }
    let csv = "\uFEFF번호,시각,VIP,이름,소속,직종,전화번호,퀴즈정답,당첨상품\n";
    completed.forEach((p, i) => {
      const time = new Date(p.ts).toLocaleString("ko-KR");
      const vip = p.isVip ? "VIP" : "";
      const quiz = p.quizCorrect === true ? "O" : p.quizCorrect === false ? "X" : "";
      csv += `${i + 1},"${time}","${vip}","${p.name}","${p.affiliation || ""}","${p.jobType}","${p.phone}","${quiz}","${p.prize}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `부스참가자_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state.participants]);

  if (loading) {
    return (
      <div className="app-container" style={{ textAlign: "center", paddingTop: 80 }}>
        <div className="spinner" />
        <p className="app-subtitle" style={{ marginTop: 16 }}>
          불러오는 중...
        </p>
      </div>
    );
  }

  return (
    <>
      <AppHeader participantCount={state.participants.filter((p) => p.completedAt).length} vipCount={vipCount} onNavigate={navigate} />

      {syncError ? (
        <div className="app-container">
          <div className="warn-box" style={{ marginBottom: 0 }}>
            <span>⚠️</span>
            <span>{syncError}</span>
          </div>
        </div>
      ) : null}

      <div className="app-container">
        {screen === "welcome" ? <WelcomeScreen onStart={() => navigate("info")} /> : null}

        {screen === "info" ? (
          <InfoInputScreen
            name={form.name}
            affiliation={form.affiliation}
            jobType={form.jobType}
            phone={form.phone}
            vipMatch={previewVip}
            submitting={submitting}
            error={formError}
            onNameChange={(v) => setForm((f) => ({ ...f, name: v }))}
            onAffiliationChange={(v) => setForm((f) => ({ ...f, affiliation: v }))}
            onJobTypeChange={(v) => setForm((f) => ({ ...f, jobType: v }))}
            onPhoneChange={(v) => setForm((f) => ({ ...f, phone: v }))}
            onCancel={goHome}
            onSubmit={() => void submitInfo()}
          />
        ) : null}

        {screen === "video" ? <VideoScreen onComplete={startQuiz} /> : null}

        {screen === "quiz" && quizQuestion ? (
          <QuizScreen question={quizQuestion} submitting={submitting} onSubmit={(i, c) => void submitQuiz(i, c)} />
        ) : null}

        {screen === "roulette" && session ? (
          <RouletteScreen
            participant={{ name: session.name, affiliation: session.affiliation }}
            prizes={state.prizes}
            wheelSegments={wheelSegments}
            stockByProduct={stockByProduct}
            spinning={spinning}
            spinTarget={spinTarget}
            onSpin={() => void spin()}
          />
        ) : null}

        {screen === "vip-thankyou" && session && resultProduct ? (
          <VipThankYouScreen
            name={session.name}
            affiliation={session.affiliation}
            prize={resultProduct.name}
            onFinish={goHome}
          />
        ) : null}

        {screen === "admin" ? (
          <AdminScreen
            state={state}
            onSavePrizeConfig={savePrizeConfig}
            onSetVipList={setVipList}
            onExportCsv={exportCsv}
            onResetParticipants={resetParticipants}
          />
        ) : null}
      </div>

      {session ? (
        <ResultModal
          open={resultOpen}
          product={resultProduct}
          recipientName={session.name}
          recipientAffiliation={session.affiliation}
          isVip={session.isVip}
          onFinish={finishPrize}
        />
      ) : null}
    </>
  );
}
