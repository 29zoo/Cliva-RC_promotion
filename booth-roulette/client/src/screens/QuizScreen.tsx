import { useState } from "react";
import type { QuizQuestion } from "../types/booth";

type QuizScreenProps = {
  question: QuizQuestion;
  submitting: boolean;
  onSubmit: (selectedIndex: number, correct: boolean) => void;
};

export function QuizScreen({ question, submitting, onSubmit }: QuizScreenProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const isCorrect = selected === question.correctIndex;

  const handleCheck = () => {
    if (selected === null) return;
    setRevealed(true);
  };

  const handleNext = () => {
    if (selected === null) return;
    onSubmit(selected, selected === question.correctIndex);
  };

  return (
    <div className="app-card">
      <div className="text-center mb-4">
        <div className="step-label">STEP 3 / 5</div>
        <h2 className="app-h2">퀴즈</h2>
        <p className="app-subtitle">5문항 중 1문항이 출제됩니다</p>
      </div>

      <div className="quiz-box">
        <p className="quiz-question">{question.question}</p>
        <div className="quiz-options">
          {question.options.map((opt, i) => {
            let cls = "quiz-option";
            if (selected === i) cls += " selected";
            if (revealed) {
              if (i === question.correctIndex) cls += " correct";
              else if (selected === i) cls += " wrong";
            }
            return (
              <button
                key={i}
                type="button"
                className={cls}
                disabled={revealed || submitting}
                onClick={() => setSelected(i)}
              >
                <span className="quiz-option-label">{String.fromCharCode(65 + i)}</span>
                {opt}
              </button>
            );
          })}
        </div>

        {revealed ? (
          <div className={`quiz-feedback ${isCorrect ? "ok" : "ng"}`}>
            <div className="font-bold mb-2">{isCorrect ? "🎉 정답입니다!" : "아쉽지만 오답입니다"}</div>
            <div className="text-sm">{question.explanation}</div>
          </div>
        ) : null}
      </div>

      {!revealed ? (
        <button
          type="button"
          className="btn-primary"
          disabled={selected === null}
          onClick={handleCheck}
        >
          정답 확인
        </button>
      ) : (
        <button type="button" className="btn-primary" disabled={submitting} onClick={handleNext}>
          {submitting ? "저장 중..." : "룰렛 돌리러 가기 →"}
        </button>
      )}
    </div>
  );
}
