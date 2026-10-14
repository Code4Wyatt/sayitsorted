import {
  billSchema,
  type Bill,
  type BillDraft,
  type BillFrequency,
} from "@repo/core";

export type BillForm = {
  name: string;
  amount: string;
  amountIsEstimate: boolean;
  frequency: BillFrequency | "";
  nextDueDate: string;
};

export const emptyBillForm: BillForm = {
  name: "",
  amount: "",
  amountIsEstimate: false,
  frequency: "",
  nextDueDate: "",
};

function poundsText(pence: number) {
  const pounds = pence / 100;
  return Number.isInteger(pounds) ? String(pounds) : pounds.toFixed(2);
}

export function draftToForm(draft: BillDraft): BillForm {
  return {
    name: draft.name ?? "",
    amount:
      draft.amountPence === undefined ? "" : poundsText(draft.amountPence),
    amountIsEstimate: draft.amountIsEstimate ?? false,
    frequency: draft.frequency ?? "",
    nextDueDate: draft.nextDueDate ?? "",
  };
}

// Each parse re-reads everything said so far, so a field only replaces the
// form's value when the latest speech changed it. Otherwise a correction to
// one field would undo the user's manual edits to the others.
export function applyParse(
  form: BillForm,
  previous: BillDraft,
  next: BillDraft,
): BillForm {
  const before = draftToForm(previous);
  const after = draftToForm(next);
  const take = (field: "name" | "amount" | "frequency" | "nextDueDate") =>
    after[field] !== "" &&
    (form[field] === "" || after[field] !== before[field]);

  const takeEstimate =
    after.amount !== "" &&
    (take("amount") || after.amountIsEstimate !== before.amountIsEstimate);

  return {
    name: take("name") ? after.name : form.name,
    amount: take("amount") ? after.amount : form.amount,
    amountIsEstimate: takeEstimate
      ? after.amountIsEstimate
      : form.amountIsEstimate,
    frequency: take("frequency") ? after.frequency : form.frequency,
    nextDueDate: take("nextDueDate") ? after.nextDueDate : form.nextDueDate,
  };
}

export function toBill(form: BillForm): Bill | null {
  const amount = form.amount.trim().replace(/^£/, "");
  const result = billSchema.safeParse({
    name: form.name.trim(),
    amountPence: amount === "" ? undefined : Math.round(Number(amount) * 100),
    amountIsEstimate: form.amountIsEstimate,
    frequency: form.frequency || undefined,
    nextDueDate: form.nextDueDate || undefined,
  });
  return result.success ? result.data : null;
}
