import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRecords } from '../hooks/useRecords';
import FileUploader from '../components/FileUploader';

jest.mock('../hooks/useRecords', () => ({ useRecords: jest.fn() }));
const mockedUseRecords = useRecords as jest.MockedFunction<typeof useRecords>;

describe('FileUploader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders file input', () => {
    const loadFiles = jest.fn();
    const reset = jest.fn();

    const mockReturn = {
      records: [],
      errors: [],
      lastError: null,
      loadFiles,
      clearRecords: jest.fn(),
      reset,
      successMessage: null,
      clearSuccessMessage: jest.fn(),
    } as unknown as ReturnType<typeof useRecords>;

    mockedUseRecords.mockReturnValue(mockReturn);

    render(<FileUploader />);
    expect(screen.getByTestId('file-input')).toBeInTheDocument();
  });

  it('calls loadFiles when a file is uploaded', async () => {
    const loadFiles = jest.fn();
    const reset = jest.fn();

    const mockReturn = {
      records: [],
      errors: [],
      lastError: null,
      loadFiles,
      clearRecords: jest.fn(),
      reset,
      successMessage: null,
      clearSuccessMessage: jest.fn(),
    } as unknown as ReturnType<typeof useRecords>;

    mockedUseRecords.mockReturnValue(mockReturn);

    render(<FileUploader />);

    const input =
      screen.queryByTestId('file-input') || document.querySelector('input[type="file"]');

    if (!input) throw new Error('Could not find file input in FileUploader component');

    const file = new File(['reference,account,description\n1,ACC,desc'], 'sample.csv', {
      type: 'text/csv',
    });

    (file as any).text = jest.fn().mockResolvedValue('reference,account,description\n1,ACC,desc');

    fireEvent.change(input as HTMLInputElement, { target: { files: [file] } });

    await waitFor(
      () => {
        expect(loadFiles).toHaveBeenCalled();
      },
      { timeout: 5000 }
    );
  });

  it('renders full report table when errors exist', () => {
    const loadFiles = jest.fn();

    const mockReturn = {
      records: [],

      errors: [{ type: 'INCORRECT_END_BALANCE', record: { reference: '1', accountNumber: 'ACC' } }],
      lastError: null,
      loadFiles,
      clearRecords: jest.fn(),
      reset: jest.fn(),
      successMessage: null,
      clearSuccessMessage: jest.fn(),
    } as unknown as ReturnType<typeof useRecords>;

    mockedUseRecords.mockReturnValue(mockReturn);

    render(<FileUploader />);

    expect(screen.getByText(/validation report/i)).toBeInTheDocument();
  });
});
