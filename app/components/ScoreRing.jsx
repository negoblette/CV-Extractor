export default function ScoreRing({ value, size = 120, font = 38, label = "dari 100" }) {
  const v = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div
      className="cv-ring"
      style={{ "--ring": `${size}px`, "--ring-font": `${font}px` }}
      role="img"
      aria-label={`Skor ${v} dari 100`}
    >
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="cv-ring__bg" cx="60" cy="60" r={r} />
        <circle
          className="cv-ring__val"
          cx="60"
          cy="60"
          r={r}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v / 100)}
        />
      </svg>
      <div className="cv-ring__num" aria-hidden="true">
        {v}
        {label ? <small>{label}</small> : null}
      </div>
    </div>
  );
}
