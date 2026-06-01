import type { QuizQuestion } from "../types/booth";

/** 국립교통재활병원 홍보 퀴즈 5문항 — 1문항 랜덤 출제 */
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "국립교통재활병원(NTRH)의 주요 전문 분야는 무엇인가요?",
    options: ["교통사고 재활", "소아 희귀질환", "심장이식", "안과 레이저"],
    correctIndex: 0,
    explanation: "국립교통재활병원은 교통사고로 인한 손상·장애 재활을 전문으로 합니다.",
  },
  {
    id: 2,
    question: "NTRH가 위치한 지역은?",
    options: ["경기도 양주시", "서울특별시 강남구", "부산광역시 해운대구", "대전광역시 유성구"],
    correctIndex: 0,
    explanation: "국립교통재활병원은 경기도 양주시에 위치해 있습니다.",
  },
  {
    id: 3,
    question: "교통재활병원에서 제공하는 대표 서비스가 아닌 것은?",
    options: ["재활치료", "응급·중환자 치료", "스포츠 선수 전담 매니지먼트", "장애인 재활"],
    correctIndex: 2,
    explanation: "교통재활병원은 교통사고 환자의 재활·치료·사회복귀를 지원합니다.",
  },
  {
    id: 4,
    question: "NTRH의 설립 목적에 가장 가까운 것은?",
    options: [
      "교통약자 및 교통사고 환자의 재활·자립 지원",
      "해외 의료관광 유치",
      "동물 실험 연구",
      "일반 종합검진 전문",
    ],
    correctIndex: 0,
    explanation: "교통사고 피해자와 교통약자의 재활·자립을 돕는 것이 핵심 미션입니다.",
  },
  {
    id: 5,
    question: "재활치료에 포함되는 분야로 적절한 것은?",
    options: ["물리치료·작업치료·언어치료", "변호·법률상담", "부동산 중개", "항공기 정비"],
    correctIndex: 0,
    explanation: "재활병원에서는 물리·작업·언어치료 등 다학제 재활 프로그램을 제공합니다.",
  },
];

export function pickRandomQuiz(): QuizQuestion {
  return QUIZ_QUESTIONS[Math.floor(Math.random() * QUIZ_QUESTIONS.length)]!;
}
