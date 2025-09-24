import { findDuplicateReferences, findIncorrectEndBalances } from '../utils/validation';
import { StatementRecord } from '../types';

describe('validation', () => {
  const sample: StatementRecord[] = [
    {
      reference: '1',
      accountNumber: 'A',
      description: 'ok',
      startBalance: 10,
      mutation: 5,
      endBalance: 15,
    },
    {
      reference: '2',
      accountNumber: 'B',
      description: 'ok2',
      startBalance: 20,
      mutation: -5,
      endBalance: 15,
    },
    {
      reference: '2',
      accountNumber: 'B',
      description: 'dup',
      startBalance: 20,
      mutation: -5,
      endBalance: 15,
    },
    {
      reference: '3',
      accountNumber: 'C',
      description: 'bad',
      startBalance: 30,
      mutation: 10,
      endBalance: 100,
    },
  ];

  it('detects duplicate references', () => {
    const dups = findDuplicateReferences(sample);
    expect(dups.length).toBe(1);
    expect((dups[0] as any).reference).toBe('2');
  });

  it('detects incorrect end balances', () => {
    const incorrect = findIncorrectEndBalances(sample);
    expect(incorrect.some((e) => e.type === 'INCORRECT_END_BALANCE')).toBe(true);
    const bad = incorrect.find((e) => e.type === 'INCORRECT_END_BALANCE');
    expect((bad as any).record.reference).toBe('3');
  });
});
