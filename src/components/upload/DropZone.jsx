"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X } from "lucide-react";
import styles from "./DropZone.module.css";

export default function DropZone({ files, setFiles, maxFiles = 10 }) {
  const onDrop = useCallback(
    (acceptedFiles) => {
      const pdfFiles = acceptedFiles.filter(
        (f) => f.type === "application/pdf"
      );
      setFiles((prev) => {
        const newFiles = [...prev, ...pdfFiles].slice(0, maxFiles);
        return newFiles;
      });
    },
    [setFiles, maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles,
  });

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className={styles.wrapper}>
      <div
        {...getRootProps()}
        className={`${styles.dropzone} ${isDragActive ? styles.active : ""}`}
      >
        <input {...getInputProps()} />
        <div className={styles.icon}>
          <Upload size={40} strokeWidth={1.5} />
        </div>
        <h3 className={styles.title}>
          {isDragActive ? "释放文件到这里" : "拖拽 PDF 文件到这里"}
        </h3>
        <p className={styles.subtitle}>
          或者 <span className={styles.link}>点击选择文件</span>
        </p>
        <p className={styles.hint}>支持 PDF 格式，最多 {maxFiles} 个文件</p>
      </div>

      {files.length > 0 && (
        <div className={styles.fileList}>
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className={styles.fileItem}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={styles.fileIcon}>
                <FileText size={20} />
              </div>
              <div className={styles.fileInfo}>
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileSize}>{formatSize(file.size)}</span>
              </div>
              <button
                className={styles.removeBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
