import type { JobType, VipEntry } from "../types/booth";
import { JOB_TYPES } from "../lib/constants";
import { VipBadge } from "../components/VipBadge";

type InfoInputScreenProps = {
  name: string;
  affiliation: string;
  jobType: JobType | "";
  phone: string;
  vipMatch: VipEntry | null;
  submitting: boolean;
  error: string | null;
  onNameChange: (v: string) => void;
  onAffiliationChange: (v: string) => void;
  onJobTypeChange: (v: JobType) => void;
  onPhoneChange: (v: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

export function InfoInputScreen({
  name,
  affiliation,
  jobType,
  phone,
  vipMatch,
  submitting,
  error,
  onNameChange,
  onAffiliationChange,
  onJobTypeChange,
  onPhoneChange,
  onCancel,
  onSubmit,
}: InfoInputScreenProps) {
  const canSubmit = name.trim() && jobType && phone.trim().replace(/\D/g, "").length >= 9;

  return (
    <div className="app-card">
      <div className="text-center mb-4">
        <div className="step-label">STEP 1 / 5</div>
        <h2 className="app-h2">인적 정보 입력</h2>
        <p className="app-subtitle">참가 정보를 입력해주세요</p>
      </div>

      {vipMatch ? <VipBadge vip={vipMatch} /> : null}

      <div className="input-group">
        <label className="app-label">
          <span className="app-label-icon">👤</span>
          이름 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          className="app-input"
          placeholder="예) 홍길동"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </div>

      <div className="input-group">
        <label className="app-label">
          <span className="app-label-icon emerald">🏢</span>
          소속 기관
        </label>
        <input
          type="text"
          className="app-input emerald"
          placeholder="예) 국립교통재활병원"
          value={affiliation}
          onChange={(e) => onAffiliationChange(e.target.value)}
        />
      </div>

      <div className="input-group">
        <label className="app-label">
          <span className="app-label-icon">💼</span>
          직종 <span className="text-red-500">*</span>
        </label>
        <select
          className="app-input"
          value={jobType}
          onChange={(e) => onJobTypeChange(e.target.value as JobType)}
        >
          <option value="">직종을 선택하세요</option>
          {JOB_TYPES.map((j) => (
            <option key={j.id} value={j.id}>
              {j.label}
            </option>
          ))}
        </select>
      </div>

      <div className="input-group">
        <label className="app-label">
          <span className="app-label-icon">📱</span>
          전화번호 <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          className="app-input"
          placeholder="예) 010-1234-5678"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
        />
      </div>

      {error ? (
        <div className="warn-box">
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>{error}</div>
        </div>
      ) : null}

      <div className="btn-row">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={submitting}>
          취소
        </button>
        <button type="button" onClick={onSubmit} className="btn-primary" disabled={!canSubmit || submitting}>
          {submitting ? "저장 중..." : "다음 →"}
        </button>
      </div>
    </div>
  );
}
