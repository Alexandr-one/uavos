'use client';

import { useState, useEffect } from "react";
import styles from "./deployment-buttons.module.css";
import Cookies from "js-cookie";

import {
  fetchPreviewStatus,
  fetchDeploymentStatus,
  fetchTags,
  startPreview as startPreviewService,
  stopPreview as stopPreviewService,
  publish as publishService,
  rollback as rollbackService,
  PreviewStatus,
  DeploymentStatus
} from "@/services/deployment-service";

interface DeploymentButtonsProps {
  apiUrl: string;
  initialTags?: string[];
  initialPreviewStatus?: PreviewStatus;
  initialDeploymentStatus?: DeploymentStatus;
}

export default function DeploymentButtons({
  apiUrl,
  initialTags = [],
  initialPreviewStatus = { isRunning: false },
  initialDeploymentStatus = {},
}: DeploymentButtonsProps) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>(initialPreviewStatus);
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>(initialDeploymentStatus);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  const storedToken = Cookies.get('token') || "";

  // -----------------------
  // Load data (preview, deployment, tags)
  // -----------------------
  const loadData = async () => {
    try {
      const [previewRes, deployRes, tagsRes] = await Promise.all([
        fetchPreviewStatus(apiUrl, storedToken),
        fetchDeploymentStatus(apiUrl, storedToken),
        fetchTags(apiUrl, storedToken),
      ]);

      setPreviewStatus(previewRes);
      setDeploymentStatus(deployRes);
      setTags(tagsRes.tags || []);
    } catch (err) {
      console.error("Failed to load deployment data:", err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [apiUrl, storedToken]);

  // -----------------------
  // Wrapper for all action methods
  // -----------------------
  const handleAction = async (
    action: () => Promise<{ success: boolean; message?: string }>,
    type: string
  ) => {
    setLoading(type);
    setMessage("");
    try {
      const result = await action();
      if (result.success) {
        setMessage(`${type} successful! ${result.message || ""}`);
        await loadData();
      } else {
        setMessage(`${type} failed: ${result.message || "Unknown error"}`);
      }
    } catch (err: any) {
      setMessage(`${type} failed: ${err.message}`);
    } finally {
      setLoading(null);
    }
  };

  // -----------------------
  // Actions
  // -----------------------
  const startPreview = () => handleAction(() => startPreviewService(apiUrl, storedToken), "preview-start");
  const stopPreview = () => handleAction(() => stopPreviewService(apiUrl, storedToken), "preview-stop");
  const publish = () => handleAction(() => publishService(apiUrl, storedToken), "publish");
  const rollback = (tag: string) => handleAction(() => rollbackService(apiUrl, tag, storedToken), `rollback-${tag}`);
  const rollbackLast = () => tags.length > 0 && rollback(tags[0]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h2 className={styles.title}>🚀 Site Deployment</h2>

        {/* Deployment Status */}
        {deploymentStatus && (
          <div
            className={`${styles.statusAlert} ${
              deploymentStatus.hasUnpublishedChanges
                ? styles.statusWarning
                : styles.statusSuccess
            }`}
          >
            <strong>📊 Status:</strong> {deploymentStatus.message || "Unknown"}
            {deploymentStatus.currentTag && (
              <div style={{ marginTop: 5, fontSize: 14 }}>
                <strong>Tag:</strong> {deploymentStatus.currentTag}
              </div>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className={styles.buttonGroup}>
          {!previewStatus.isRunning ? (
            <button
              onClick={startPreview}
              disabled={!!loading}
              className={`${styles.button} ${styles.buttonStartPreview}`}
            >
              {loading === "preview-start" ? "Starting..." : "📋 Start Preview"}
            </button>
          ) : (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                onClick={stopPreview}
                disabled={!!loading}
                className={`${styles.button} ${styles.buttonStopPreview}`}
              >
                {loading === "preview-stop" ? "Stopping..." : "⏹️ Stop Preview"}
              </button>
              {previewStatus.url && (
                <a
                  href={previewStatus.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.buttonLink}
                >
                  🌐 Open Preview
                </a>
              )}
            </div>
          )}

          <button
            onClick={publish}
            disabled={!!loading}
            className={`${styles.button} ${styles.buttonPublish}`}
          >
            {loading === "publish" ? "Publishing..." : "🚀 Publish"}
          </button>

          {/* Rollback Last */}
          {tags.length > 0 && (
            <button
              onClick={rollbackLast}
              disabled={!!loading}
              className={`${styles.button} ${styles.buttonRollback}`}
            >
              {loading === `rollback-${tags[0]}` ? "Rolling back..." : `↩️ Rollback Last (${tags[0]})`}
            </button>
          )}
        </div>

        {/* Versions / Rollback */}
        {tags.length > 0 && (
          <div className={styles.tagList}>
            <h3 style={{ fontSize: 16, marginBottom: 10 }}>📜 All versions:</h3>
            {tags.map((tag) => (
              <div key={tag} className={styles.tagItem}>
                <span>{tag}</span>
                <button
                  onClick={() => rollback(tag)}
                  disabled={!!loading}
                  className={styles.tagButton}
                  style={{
                    backgroundColor: loading === `rollback-${tag}` ? "#ccc" : "#17a2b8",
                  }}
                >
                  {loading === `rollback-${tag}` ? "Rolling..." : "Rollback"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Preview Info */}
        {previewStatus.isRunning && (
          <div className={styles.previewStatus}>
            ✅ Preview server is running on port {previewStatus.port}
            {previewStatus.url && (
              <div style={{ marginTop: 5 }}>
                <strong>URL:</strong>{" "}
                <a href={previewStatus.url} target="_blank" rel="noopener noreferrer">
                  {previewStatus.url}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        {message && (
          <div
            className={`${styles.message} ${
              message.includes("failed")
                ? styles.messageError
                : styles.messageSuccess
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
