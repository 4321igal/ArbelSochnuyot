import { useState, useCallback } from 'react';
import type { CSVPreviewItem } from '../types';

function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const c = row[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if ((c === ',' && !inQuotes) || (c === '\n' && !inQuotes)) {
      result.push(current.trim());
      current = '';
      if (c === '\n') break;
    } else {
      current += c;
    }
  }
  if (current.length) result.push(current.trim());
  return result;
}

function parseCSV(text: string): { items: CSVPreviewItem[]; headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return { items: [], headers: [], rows: [] };
  const header = parseCSVRow(lines[0]).map((h) => h.trim());
  const headerLower = header.map((h) => h.toLowerCase().trim());
  const rawNameIdx = headerLower.indexOf('rawname');
  const rawDescIdx = headerLower.indexOf('rawdescription');
  const barcodeIdx = headerLower.indexOf('barcode');
  const categoryIdx = headerLower.indexOf('category');
  const nameIdx = headerLower.indexOf('name');
  const descIdx = headerLower.indexOf('description');

  const items: CSVPreviewItem[] = [];
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCSVRow(lines[i]);
    if (cells.length === 0) continue;
    const row: Record<string, string> = {};
    header.forEach((h, idx) => {
      row[h] = cells[idx] ?? '';
    });
    rows.push(row);
    items.push({
      rawName: rawNameIdx >= 0 ? cells[rawNameIdx] : nameIdx >= 0 ? cells[nameIdx] : cells[0],
      name: nameIdx >= 0 ? cells[nameIdx] : undefined,
      rawDescription: rawDescIdx >= 0 ? cells[rawDescIdx] : descIdx >= 0 ? cells[descIdx] : undefined,
      description: descIdx >= 0 ? cells[descIdx] : undefined,
      category: categoryIdx >= 0 ? cells[categoryIdx] : undefined,
      barcode: barcodeIdx >= 0 ? cells[barcodeIdx] : undefined,
    });
  }
  return { items, headers: header, rows };
}

export type { CSVPreviewItem };

export function useCSVImport() {
  const [csvFile, setCSVFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<CSVPreviewItem[]>([]);

  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);

  const onCSVUpload = useCallback((file: File) => {
    setCSVFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const { items, headers, rows } = parseCSV(text);
      setImportPreview(items);
      setCsvHeaders(headers);
      setCsvRows(rows);
    };
    reader.readAsText(file, 'utf-8');
  }, []);

  const selectNew = useCallback(() => {
    setCSVFile(null);
    setImportPreview([]);
    setCsvHeaders([]);
    setCsvRows([]);
  }, []);

  const reset = useCallback(() => {
    setCSVFile(null);
    setImportPreview([]);
    setCsvHeaders([]);
    setCsvRows([]);
  }, []);

  return {
    csvFile,
    importPreview,
    csvHeaders,
    csvRows,
    onCSVUpload,
    selectNew,
    reset,
  };
}
