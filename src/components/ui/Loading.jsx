"use client";

import styles from "./Loading.module.css";

export function Spinner({ size = 24, color }) {
  return (
    <svg
      className={styles.spinner}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || "var(--color-primary)"}
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

export function PageLoader({ text = "加载中..." }) {
  return (
    <div className={styles.pageLoader}>
      <Spinner size={36} />
      <p>{text}</p>
    </div>
  );
}

export function ProgressBar({ progress, text }) {
  return (
    <div className={styles.progressWrapper}>
      <div className={styles.progressHeader}>
        <span className={styles.progressText}>{text}</span>
        <span className={styles.progressPercent}>{Math.round(progress)}%</span>
      </div>
      <div className={styles.progressTrack}>
        <div
          className={styles.progressFill}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
