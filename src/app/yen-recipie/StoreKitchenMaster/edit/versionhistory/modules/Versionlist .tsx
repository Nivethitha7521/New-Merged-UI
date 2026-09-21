
"use client";

import { Visibility as VisibilityIcon } from "@mui/icons-material"; // ✅ added
import { IconButton } from "@mui/material"; // ✅ added

import styles from "../../../skm.module.css";
import { VersionSummary, VersionDetail } from "../models/versionhistortmodel";

interface VersionListProps {
  versions: VersionSummary[];
  selectedVersion: VersionDetail | null;
  onSelectVersion: (version: number) => void;
  onToggleStatus: (version: number, e: React.MouseEvent) => void;
  onViewVersion: (version: number) => void; // ✅ added
}

export default function VersionList({
  versions,
  selectedVersion,
  onSelectVersion,
  onToggleStatus,
  onViewVersion, // ✅ added
}: VersionListProps) {
  return (
    <div className={styles.versionListWrapper}>
      {versions.map((v) => {
        const isActive = selectedVersion?.version === v.version;

        return (
          <div
            key={v.version}
            onClick={() => onSelectVersion(v.version)}
            className={`${styles.versionItem} ${isActive ? styles.versionItemActive : ""}`}
          >
            <div className={styles.versionRow}>
              <div className={styles.versionInfo}>
                <p className={styles.versionLabel}>
                  v{v.version}
                  {v.status && <span className={styles.versionCurrentTag}>(Current)</span>}
                </p>
                <p className={styles.versionCost}>Cost: ₹{v.cost}</p>
              </div>

              <div className={styles.versionControls}>
                <span
                  className={`${styles.statusLabel} ${
                    v.status ? styles.statusLabelActive : styles.statusLabelInactive
                  }`}
                >
                  {v.status ? "Active" : "Inactive"}
                </span>

                {/* ✅ added — eye icon, placed before the toggle switch */}
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewVersion(v.version);
                  }}
                  title="View Details"
                  aria-label="View recipe details"
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>

                <button
                  onClick={(e) => onToggleStatus(v.version, e)}
                  className={`${styles.toggleSwitch} ${
                    v.status ? styles.toggleOn : styles.toggleOff
                  }`}
                  aria-pressed={v.status}
                >
                  <span
                    className={`${styles.toggleThumb} ${
                      v.status ? styles.toggleThumbOn : styles.toggleThumbOff
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}