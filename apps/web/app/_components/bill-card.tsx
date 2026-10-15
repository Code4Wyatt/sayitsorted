"use client";

import { billFrequencySchema } from "@repo/core";
import { frequencyLabels } from "../../lib/format";
import { toBill, type BillForm } from "../_lib/bill-form";
import styles from "./capture.module.css";

type Props = {
  form: BillForm;
  onChange: (form: BillForm) => void;
  onSave: () => void;
  onDiscard: () => void;
};

export function BillCard({ form, onChange, onSave, onDiscard }: Props) {
  const update = (changes: Partial<BillForm>) =>
    onChange({ ...form, ...changes });
  const complete = toBill(form) !== null;

  return (
    <form
      className={styles.card}
      onSubmit={(event) => {
        event.preventDefault();
        if (complete) onSave();
      }}
    >
      {!complete && (
        <p className={styles.cardHint}>Say or fill in what&apos;s missing.</p>
      )}

      <label className={styles.field} data-missing={!form.name.trim()}>
        <span>{form.name.trim() ? "Bill" : "What's it for?"}</span>
        <input
          value={form.name}
          onChange={(event) => update({ name: event.target.value })}
          placeholder="Council tax"
        />
      </label>

      <div className={styles.field} data-missing={!form.amount.trim()}>
        <label htmlFor="bill-amount">
          {form.amount.trim() ? "Amount" : "How much?"}
        </label>
        <div className={styles.amountRow}>
          <span className={styles.currency}>£</span>
          <input
            id="bill-amount"
            value={form.amount}
            onChange={(event) => update({ amount: event.target.value })}
            inputMode="decimal"
            placeholder="0"
          />
          <label className={styles.estimate}>
            <input
              type="checkbox"
              checked={form.amountIsEstimate}
              onChange={(event) =>
                update({ amountIsEstimate: event.target.checked })
              }
            />
            Roughly
          </label>
        </div>
      </div>

      <label className={styles.field} data-missing={!form.frequency}>
        <span>{form.frequency ? "How often" : "How often?"}</span>
        <select
          value={form.frequency}
          onChange={(event) =>
            update({ frequency: event.target.value as BillForm["frequency"] })
          }
        >
          <option value="" disabled>
            Choose…
          </option>
          {billFrequencySchema.options.map((frequency) => (
            <option key={frequency} value={frequency}>
              {frequencyLabels[frequency]}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field} data-missing={!form.nextDueDate}>
        <span>{form.nextDueDate ? "Next due" : "When's it next due?"}</span>
        <input
          type="date"
          value={form.nextDueDate}
          onChange={(event) => update({ nextDueDate: event.target.value })}
        />
      </label>

      <div className={styles.cardActions}>
        <button type="submit" className={styles.primary} disabled={!complete}>
          Save bill
        </button>
        <button type="button" className={styles.secondary} onClick={onDiscard}>
          Start again
        </button>
      </div>
    </form>
  );
}
