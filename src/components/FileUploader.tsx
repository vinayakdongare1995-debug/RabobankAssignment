import React, { ChangeEvent, useRef, useState } from 'react';
import { useRecords } from '../hooks/useRecords';
import ReportTable from './ReportTable';

export default function FileUploader(): JSX.Element {
  const { errors, loadFiles, lastError, reset, successMessage, clearSuccessMessage } = useRecords();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const normalizeError = (error: unknown) => {
    if (!error) return '';
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as any).message === 'string'
    ) {
      return (error as any).message;
    }
    try {
      return String(error);
    } catch {
      return '';
    }
  };

  const combinedError =
    [lastError, localError].filter(Boolean).map(normalizeError).filter(Boolean).join(' — ') || null;

  const isAllowedExtension = (name: string | undefined) => {
    if (!name) return false;
    const lower = name.toLowerCase();
    return lower.endsWith('.csv') || lower.endsWith('.xml');
  };

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      reset?.();
      clearSuccessMessage?.();
      setLocalError('No file selected');
      return;
    }
    if (files.length > 1) {
      reset?.();
      clearSuccessMessage?.();
      setLocalError('Please upload only one file at a time');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    const file = files[0];
    if (!isAllowedExtension(file.name)) {
      reset?.();
      setLocalError('Invalid file type — only .csv and .xml are supported');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (file.size === 0) {
      reset?.();
      clearSuccessMessage?.();
      setLocalError('Uploaded file is empty');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    try {
      const text = await file.text();
      if (!text || text.trim().length === 0) {
        reset?.();
        setLocalError('Uploaded file contains no readable content');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    } catch {
      reset?.();
      setLocalError('Could not read file');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    reset?.();
    clearSuccessMessage?.();
    setLocalError(null);
    loadFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openFileDialog = () => {
    setLocalError(null);
    fileInputRef.current?.click();
  };

  const onLabelKeyDown = (ev: React.KeyboardEvent<HTMLLabelElement>) => {
    if (ev.key === 'Enter' || ev.key === ' ' || ev.code === 'Space') {
      ev.preventDefault();
      openFileDialog();
    }
  };

  const onReset = () => {
    if (typeof reset === 'function') {
      reset();
    } else if (
      typeof window !== 'undefined' &&
      window.location &&
      typeof window.location.reload === 'function'
    ) {
      window.location.reload();
    } else {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
    setLocalError(null);
  };

  const showReport = Array.isArray(errors) && errors.length > 0;

  return (
    <div className="app">
      <div className="card">
        <div className="header">
          <h1 className="h1">Rabobank Customer Statement Processor</h1>
          <p className="h2">
            Upload statements (.csv / .xml) — validate duplicate refs &amp; end balances
          </p>
        </div>

        <div className="uploader">
          <div className="file-control">
            <label
              htmlFor="file"
              className="file-btn"
              role="button"
              tabIndex={0}
              onClick={(ev) => {
                ev.preventDefault();
                openFileDialog();
              }}
              onKeyDown={onLabelKeyDown}
            >
              Upload file
            </label>

            <input
              ref={fileInputRef}
              id="file"
              type="file"
              accept=".csv,.xml"
              onChange={onFileChange}
              className="file-input"
              data-testid="file-input"
            />

            <div className="note">Only .csv and .xml (one file)</div>
          </div>
        </div>

        {successMessage && (
          <div className="success" data-testid="success-message">
            {successMessage}
          </div>
        )}

        {combinedError && (
          <div className="error" data-testid="error-message">
            {combinedError}
          </div>
        )}

        {showReport && (
          <div className="report card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>Validation report</strong>
                <div className="note" style={{ marginTop: 4 }}>
                  Shows duplicate references and incorrect end balances
                </div>
              </div>
              <button className="btnReset" onClick={onReset} data-testid="reset-button">
                Reset
              </button>
            </div>
            <div className="table-wrap">
              <ReportTable errors={errors} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
