import { ValidationError } from '../utils/validation';
import { StatementRecord } from '../types';

type Props = { errors: ValidationError[] };

const DUPLICATE_REFERENCE = 'DUPLICATE_REFERENCE';
const INCORRECT_END_BALANCE = 'INCORRECT_END_BALANCE';
const DUPLICATE_MESSAGE = 'Duplicate reference';
const INCORRECT_BALANCE_MESSAGE = 'Incorrect end balance';

function buildValidationResults(
  errors: ValidationError[]
): (StatementRecord & { errorMsg: string })[] {
  type ValidationGroup = {
    records: StatementRecord[];
    messages: Set<string>;
  };

  const validationGroups = new Map<string, ValidationGroup>();

  const makeRecordKey = (record: StatementRecord) =>
    `${record.reference ?? ''}::${record.accountNumber ?? ''}::${record.description ?? ''}::${String(
      record.startBalance ?? ''
    )}::${String(record.mutation ?? '')}::${String(record.endBalance ?? '')}`;

  const getOrCreateValidationGroup = (key: string): ValidationGroup => {
    let validationGroup = validationGroups.get(key);
    if (!validationGroup) {
      validationGroup = { records: [], messages: new Set<string>() };
      validationGroups.set(key, validationGroup);
    }
    return validationGroup;
  };

  for (const error of errors) {
    if (error.type === DUPLICATE_REFERENCE) {
      const records = Array.isArray(error.records)
        ? error.records
        : error.records
          ? [error.records]
          : [];

      for (const record of records) {
        const key = `${record.reference}-${record.accountNumber}`;
        const validationGroup = getOrCreateValidationGroup(key);

        const recordKey = makeRecordKey(record);
        const exists = validationGroup.records.some((r) => makeRecordKey(r) === recordKey);

        if (!exists) {
          validationGroup.records.push(record);
        }

        validationGroup.messages.add(DUPLICATE_MESSAGE);
      }
    } else if (error.type === INCORRECT_END_BALANCE) {
      const record = error.record as StatementRecord;
      const key = `${record.reference}-${record.accountNumber}`;
      const validationGroup = getOrCreateValidationGroup(key);

      const recordKey = makeRecordKey(record);
      const exists = validationGroup.records.some((r) => makeRecordKey(r) === recordKey);

      if (!exists) {
        validationGroup.records.push(record);
      }

      validationGroup.messages.add(INCORRECT_BALANCE_MESSAGE);
    }
  }

  const validationResults: (StatementRecord & { errorMsg: string })[] = [];

  for (const validationGroup of validationGroups.values()) {
    const message = Array.from(validationGroup.messages).join(', ');
    for (const record of validationGroup.records) {
      validationResults.push({
        ...record,
        errorMsg: message,
      });
    }
  }

  validationResults.sort((a, b) => {
    if (a.reference !== b.reference) {
      return String(a.reference).localeCompare(String(b.reference));
    }
    return String(a.accountNumber).localeCompare(String(b.accountNumber));
  });

  return validationResults;
}

export default function ReportTable({ errors }: Props) {
  if (!errors || errors.length === 0) {
    return null;
  }

  const mergedResults = buildValidationResults(errors);

  return (
    <div className="report">
      <div className="report controls" style={{ marginBottom: 12 }}>
        <strong>Found {mergedResults.length} failing rows</strong>
        <div className="small-muted">Shows duplicates and incorrect end balances</div>
      </div>

      <div className="table-wrap">
        <table
          className="table"
          role="table"
          aria-label="Validation failures"
          data-testid="validation-table"
        >
          <thead>
            <tr>
              <th className="col-small">Reference</th>
              <th>Account Number</th>
              <th>Description</th>
              <th>Start Balance</th>
              <th>Mutation</th>
              <th>End Balance</th>
              <th>Error</th>
            </tr>
          </thead>

          <tbody>
            {mergedResults.map((record) => (
              <tr
                key={`${record.reference}-${record.accountNumber}-${record.description ?? ''}`}
                data-testid={`row-${record.reference}`}
              >
                <td className="col-small">{record.reference}</td>
                <td>{record.accountNumber}</td>
                <td>{record.description}</td>
                <td>{record.startBalance ?? '-'}</td>
                <td>{record.mutation ?? '-'}</td>
                <td>{record.endBalance ?? '-'}</td>
                <td>{record.errorMsg}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
