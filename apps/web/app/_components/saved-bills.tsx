"use client";

import { formatAmount, formatDueDate, frequencyLabels } from "../../lib/format";
import styles from "./capture.module.css";
import { useSavedBills } from "../_lib/saved-bills-store";

export function SavedBills() {
  const { bills, remove } = useSavedBills();
  if (bills.length === 0) return null;

  const upcoming = [...bills].sort((a, b) =>
    a.nextDueDate.localeCompare(b.nextDueDate),
  );

  return (
    <section className={styles.saved} aria-labelledby="saved-heading">
      <h2 id="saved-heading">Coming up</h2>
      <ul>
        {upcoming.map((bill) => (
          <li key={bill.id}>
            <div>
              <strong>{bill.name}</strong>
              <span>
                {formatDueDate(bill.nextDueDate)} ·{" "}
                {frequencyLabels[bill.frequency].toLowerCase()}
              </span>
            </div>
            <span className={styles.savedAmount}>
              {formatAmount(bill.amountPence, bill.amountIsEstimate)}
            </span>
            <button
              type="button"
              className={styles.remove}
              onClick={() => remove(bill.id)}
              aria-label={`Remove ${bill.name}`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
