"use client";

import styles from "../../../skm.module.css";
import { VersionDetail } from "../models/versionhistortmodel";

interface ItemsTableProps {
  items: VersionDetail["items"];
}

export default function ItemsTable({ items }: ItemsTableProps) {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead className={styles.thead}>
          <tr>
            <th className={styles.th}>Item</th>
            <th className={`${styles.th} ${styles.thCenter}`}>Type</th>
            <th className={`${styles.th} ${styles.thRight}`}>Qty</th>
            <th className={`${styles.th} ${styles.thRight}`}>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className={styles.tbodyRow}>
              <td className={styles.td}>
                <div className={styles.itemName}>{item.name}</div>
                <div className={styles.itemCode}>{item.code}</div>
              </td>
              <td className={`${styles.td} ${styles.tdCenter}`}>
                <span
                  className={`${styles.badge} ${
                    item.type === "SFG" ? styles.badgeSFG : styles.badgeRM
                  }`}
                >
                  {item.type}
                </span>
              </td>
              <td className={`${styles.td} ${styles.tdRight} ${styles.qtyText}`}>
                {item.quantity}
              </td>
              <td className={`${styles.td} ${styles.tdRight}`}>
                {item.totalPrice !== undefined ? (
                  <span className={styles.priceText}>₹{item.totalPrice.toFixed(2)}</span>
                ) : (
                  <span className={styles.priceEmpty}>—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}