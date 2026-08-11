"use client";

import styles from "../../../skm.module.css";
import { VersionDetail } from "../models/versionhistortmodel"
import ItemsTable from "./ItemsTable";

interface VersionDetailsPanelProps {
  selectedVersion: VersionDetail | null;
  makingCost: number;
  salesCost: number;
  profit: number;
}

export default function VersionDetailsPanel({
  selectedVersion,
  makingCost,
  salesCost,
  profit,
}: VersionDetailsPanelProps) {
  if (!selectedVersion) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📋</div>
        <p className={styles.emptyText}>Select a version to view details</p>
      </div>
    );
  }

  return (
    <div className={styles.detailsRoot}>
      {/* Top info grid */}
      <div className={styles.infoGrid}>
        <div>
          <p className={styles.infoLabel}>Recipe</p>
          <p className={styles.infoValueTruncate}>{selectedVersion.recipeName}</p>
        </div>
        <div>
          <p className={styles.infoLabel}>Version</p>
          <p className={styles.infoValue}>{selectedVersion.version}</p>
        </div>
        <div>
          <p className={styles.infoLabel}>Cost</p>
          <p className={styles.infoValue}>₹{selectedVersion.cost}</p>
        </div>
       <div>
          <p className={styles.infoLabel}>Status</p>
          <p
            className={`${styles.infoValue} ${
              selectedVersion.status ? styles.infoStatusActive : styles.infoStatusInactive
            }`}
          >
            {selectedVersion.status ? "Active" : "Inactive"}
          </p>
        </div>
      </div>

      {/* Items Used */}
      <div className={styles.itemsSection}>
        <h2 className={styles.itemsSectionTitle}>Items Used</h2>

        <ItemsTable items={selectedVersion.items} />

        {/* Cost summary */}
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>Making Cost</div>
            <div className={styles.summaryValue}>₹{makingCost.toFixed(2)}</div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>Sale Cost</div>
            <div className={styles.summaryValue}>₹{salesCost.toFixed(2)}</div>
          </div>

          <div
            className={`${styles.summaryCard} ${
              profit >= 0 ? styles.summaryCardProfit : styles.summaryCardLoss
            }`}
          >
            <div className={styles.summaryLabel}>Profit</div>
            <div
              className={`${styles.summaryValueBold} ${
                profit < 0 ? styles.summaryValueNegative : ""
              }`}
            >
              ₹{profit.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}