"use client";

import styles from "./Card.module.css";

export default function Card({
  children,
  className = "",
  padding = "md",
  hover = false,
  onClick,
  animate = false,
  ...props
}) {
  return (
    <div
      className={`${styles.card} ${styles[`padding-${padding}`]} ${
        hover ? styles.hover : ""
      } ${animate ? "animate-fade-in-up" : ""} ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      {children}
    </div>
  );
}
