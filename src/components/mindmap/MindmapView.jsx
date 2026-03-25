"use client";

import styles from "./MindmapView.module.css";

/**
 * 思维导图可视化组件（纯 CSS 树形结构）
 */
export default function MindmapView({ data }) {
  if (!data) return null;

  return (
    <div className={styles.container}>
      <div className={styles.tree}>
        <MindmapNode node={data} isRoot />
      </div>
    </div>
  );
}

function MindmapNode({ node, isRoot = false }) {
  if (!node) return null;

  return (
    <div className={`${styles.node} ${isRoot ? styles.rootNode : ""}`}>
      <div className={`${styles.nodeLabel} ${isRoot ? styles.rootLabel : ""}`}>
        {node.title}
      </div>
      {node.children && node.children.length > 0 && (
        <div className={styles.children}>
          {node.children.map((child, i) => (
            <MindmapNode key={i} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}
