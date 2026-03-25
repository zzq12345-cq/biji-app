"use client";

import { useMemo } from "react";
import styles from "./LearningCalendar.module.css";

/**
 * 学习日历热力图
 * notes: 笔记数组（需包含 created_at 字段）
 */
export default function LearningCalendar({ notes = [] }) {
  // 生成过去 90 天的日期数据
  const calendarData = useMemo(() => {
    const days = [];
    const now = new Date();
    const countMap = {};

    // 统计每天的笔记数
    notes.forEach((n) => {
      if (!n.created_at) return;
      const dateKey = new Date(n.created_at).toISOString().slice(0, 10);
      countMap[dateKey] = (countMap[dateKey] || 0) + 1;
    });

    for (let i = 89; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({
        date: key,
        count: countMap[key] || 0,
        label: `${d.getMonth() + 1}/${d.getDate()}`,
      });
    }
    return days;
  }, [notes]);

  const totalNotes = notes.length;
  const activeDays = calendarData.filter((d) => d.count > 0).length;
  const maxCount = Math.max(...calendarData.map((d) => d.count), 1);

  const getLevel = (count) => {
    if (count === 0) return 0;
    if (count <= maxCount * 0.25) return 1;
    if (count <= maxCount * 0.5) return 2;
    if (count <= maxCount * 0.75) return 3;
    return 4;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>学习日历</h3>
        <div className={styles.stats}>
          <span><strong>{totalNotes}</strong> 篇笔记</span>
          <span><strong>{activeDays}</strong> 天活跃</span>
        </div>
      </div>
      <div className={styles.grid}>
        {calendarData.map((day, i) => (
          <div
            key={i}
            className={`${styles.cell} ${styles[`level${getLevel(day.count)}`]}`}
            title={`${day.date}: ${day.count} 篇笔记`}
          />
        ))}
      </div>
      <div className={styles.legend}>
        <span className={styles.legendLabel}>少</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <div key={l} className={`${styles.cell} ${styles[`level${l}`]}`} />
        ))}
        <span className={styles.legendLabel}>多</span>
      </div>
    </div>
  );
}
