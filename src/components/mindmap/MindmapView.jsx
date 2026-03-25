"use client";

import styles from "./MindmapView.module.css";

export default function MindmapView({ data }) {
  if (!data) return null;

  return (
    <div className={styles.container}>
      <h2 className={styles.rootTitle}>{data.title}</h2>
      {data.children && (
        <div className={styles.grid}>
          {data.children.map((branch, i) => (
            <div key={i} className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
                <h3 className={styles.cardTitle}>{branch.title}</h3>
              </div>
              {branch.children && (
                <ul className={styles.list}>
                  {branch.children.map((item, j) => (
                    <li key={j} className={styles.item}>
                      <span className={styles.itemText}>{item.title}</span>
                      {item.children && item.children.length > 0 && (
                        <ul className={styles.subList}>
                          {item.children.map((sub, k) => (
                            <li key={k} className={styles.subItem}>{sub.title}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
