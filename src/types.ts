export interface StatementRecord {
  reference?: string | number;
  accountNumber?: string;
  description?: string;
  startBalance?: number;
  mutation?: number;
  endBalance?: number;
}
