"use client";

import { useState } from "react";
import styles from "./FormulaPanel.module.css";

const FORMULA_CATEGORIES = [
  {
    name: "基础运算",
    formulas: [
      { label: "分式", latex: "\\frac{a}{b}" },
      { label: "根号", latex: "\\sqrt{x}" },
      { label: "n次根", latex: "\\sqrt[n]{x}" },
      { label: "上标", latex: "x^{n}" },
      { label: "下标", latex: "x_{i}" },
      { label: "求和", latex: "\\sum_{i=1}^{n}" },
      { label: "乘积", latex: "\\prod_{i=1}^{n}" },
    ],
  },
  {
    name: "微积分",
    formulas: [
      { label: "极限", latex: "\\lim_{x \\to \\infty}" },
      { label: "导数", latex: "f'(x)" },
      { label: "偏导", latex: "\\frac{\\partial f}{\\partial x}" },
      { label: "积分", latex: "\\int_{a}^{b} f(x) dx" },
      { label: "二重积分", latex: "\\iint_{D} f(x,y) dxdy" },
      { label: "梯度", latex: "\\nabla f" },
    ],
  },
  {
    name: "线性代数",
    formulas: [
      { label: "矩阵", latex: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}" },
      { label: "行列式", latex: "\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}" },
      { label: "转置", latex: "A^{T}" },
      { label: "逆矩阵", latex: "A^{-1}" },
      { label: "点积", latex: "\\vec{a} \\cdot \\vec{b}" },
      { label: "叉积", latex: "\\vec{a} \\times \\vec{b}" },
    ],
  },
  {
    name: "概率统计",
    formulas: [
      { label: "期望", latex: "E(X) = \\sum x_i p_i" },
      { label: "方差", latex: "D(X) = E(X^2) - [E(X)]^2" },
      { label: "正态分布", latex: "X \\sim N(\\mu, \\sigma^2)" },
      { label: "组合", latex: "\\binom{n}{k}" },
      { label: "条件概率", latex: "P(A|B) = \\frac{P(AB)}{P(B)}" },
    ],
  },
  {
    name: "希腊字母",
    formulas: [
      { label: "α", latex: "\\alpha" },
      { label: "β", latex: "\\beta" },
      { label: "γ", latex: "\\gamma" },
      { label: "δ", latex: "\\delta" },
      { label: "θ", latex: "\\theta" },
      { label: "λ", latex: "\\lambda" },
      { label: "μ", latex: "\\mu" },
      { label: "σ", latex: "\\sigma" },
      { label: "π", latex: "\\pi" },
      { label: "Ω", latex: "\\Omega" },
    ],
  },
  {
    name: "关系符号",
    formulas: [
      { label: "≤", latex: "\\leq" },
      { label: "≥", latex: "\\geq" },
      { label: "≠", latex: "\\neq" },
      { label: "≈", latex: "\\approx" },
      { label: "∈", latex: "\\in" },
      { label: "⊂", latex: "\\subset" },
      { label: "→", latex: "\\to" },
      { label: "⇒", latex: "\\Rightarrow" },
      { label: "∞", latex: "\\infty" },
    ],
  },
];

export default function FormulaPanel({ onInsert }) {
  const [activeCategory, setActiveCategory] = useState(0);

  const handleInsert = (latex) => {
    if (onInsert) onInsert(`$${latex}$`);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.tabs}>
        {FORMULA_CATEGORIES.map((cat, i) => (
          <button
            key={i}
            className={`${styles.tab} ${i === activeCategory ? styles.tabActive : ""}`}
            onClick={() => setActiveCategory(i)}
          >
            {cat.name}
          </button>
        ))}
      </div>
      <div className={styles.grid}>
        {FORMULA_CATEGORIES[activeCategory].formulas.map((f, i) => (
          <button
            key={i}
            className={styles.formulaBtn}
            onClick={() => handleInsert(f.latex)}
            title={f.latex}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
