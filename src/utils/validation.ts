import { StatementRecord } from '../types';

export type ValidationError =
  | { type: 'DUPLICATE_REFERENCE'; reference: string; records: StatementRecord[] }
  | { type: 'INCORRECT_END_BALANCE'; record: StatementRecord; expectedEnd: number | null };
export function findDuplicateReferences(records: StatementRecord[]): ValidationError[] {
  const map = new Map<string, StatementRecord[]>();

  for (const r of records) {
    const ref = (r.reference ?? '').toString().trim();
    if (ref === '') {
      continue;
    }

    const key = ref;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }

  const validationErrorResult: ValidationError[] = [];
  for (const [ref, arr] of map.entries()) {
    if (arr.length > 1) {
      validationErrorResult.push({ type: 'DUPLICATE_REFERENCE', reference: ref, records: arr });
    }
  }
  return validationErrorResult;
}
export function findIncorrectEndBalances(records: StatementRecord[]): ValidationError[] {
  const incorrectBalances: ValidationError[] = [];

  for (const r of records) {
    const start = r.startBalance;
    const mutation = r.mutation;
    const end = r.endBalance;
    if (!Number.isFinite(start) || !Number.isFinite(mutation) || !Number.isFinite(end)) {
      incorrectBalances.push({ type: 'INCORRECT_END_BALANCE', record: r, expectedEnd: null });
      continue;
    }

    const expected = Number((start + mutation).toFixed(2));
    const actual = Number(end);
    if (!Number.isFinite(actual)) {
      incorrectBalances.push({ type: 'INCORRECT_END_BALANCE', record: r, expectedEnd: expected });
      continue;
    }
    if (Math.abs(expected - actual) > 0.01) {
      incorrectBalances.push({ type: 'INCORRECT_END_BALANCE', record: r, expectedEnd: expected });
    }
  }

  return incorrectBalances;
}
