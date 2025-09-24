import { useCallback, useState } from 'react';
import { StatementRecord } from '../types';
import { parseFile } from '../utils/parser';
import {
  findDuplicateReferences,
  findIncorrectEndBalances,
  ValidationError,
} from '../utils/validation';

export function useRecords() {
  const [records, setRecords] = useState<StatementRecord[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const reset = useCallback(() => {
    setRecords([]);
    setErrors([]);
    setLastError(null);
    setSuccessMessage(null);
  }, []);

  const clearSuccessMessage = useCallback(() => {
    setSuccessMessage(null);
  }, []);

  const loadFiles = useCallback(
    async (files: FileList | null) => {
      setLastError(null);
      setSuccessMessage(null);

      if (!files || files.length === 0) {
        setLastError('No file selected.');
        reset();
        return;
      }

      const file = files[0];
      if (file.size === 0) {
        setLastError(`Blank file cannot be uploaded: ${file.name}`);
        reset();
        return;
      }

      try {
        const parsed = await parseFile(file);

        if (!parsed || parsed.length === 0) {
          setLastError(`File contains no records: ${file.name}`);
          reset();
          return;
        }

        setRecords(parsed);

        const duplicates = findDuplicateReferences(parsed);
        const incorrectBalances = findIncorrectEndBalances(parsed);
        const combined = [...duplicates, ...incorrectBalances];

        setErrors(combined.length > 0 ? combined : []);
        if (combined.length === 0) {
          setSuccessMessage('File processed successfully — data is correct.');
        }
      } catch (err) {
        setLastError(`Error parsing file: ${file.name}`);
        reset();
      }
    },
    [reset]
  );

  return { records, errors, lastError, successMessage, loadFiles, reset, clearSuccessMessage };
}
