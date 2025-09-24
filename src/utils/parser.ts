import { StatementRecord } from '../types';

async function decodeArrayBuffer(buffer: ArrayBuffer): Promise<string> {
  const tryDecode = (label: string) => {
    try {
      // @ts-ignore
      return new TextDecoder(label).decode(buffer);
    } catch {
      return '';
    }
  };

  const utf8 = tryDecode('utf-8');
  if (utf8 && !utf8.includes('\uFFFD')) return utf8;

  const win1252 = tryDecode('windows-1252');
  if (win1252 && !win1252.includes('\uFFFD')) return win1252;

  const iso = tryDecode('iso-8859-1');
  if (iso && !iso.includes('\uFFFD')) return iso;

  return utf8 || win1252 || iso || '';
}

export async function parseFile(file: File): Promise<StatementRecord[]> {
  let text: string;
  if (typeof (file as any).arrayBuffer === 'function') {
    const buffer = await (file as any).arrayBuffer();
    text = await decodeArrayBuffer(buffer);
  } else if (typeof (file as any).text === 'function') {
    text = await (file as any).text();
  } else {
    text = await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = () => reject(fr.error);
      fr.readAsText(file);
    });
  }

  if (file.name.toLowerCase().endsWith('.csv')) {
    return parseCsv(text);
  } else if (file.name.toLowerCase().endsWith('.xml')) {
    return parseXml(text);
  }
  throw new Error('Unsupported file type');
}

function parseCsv(content: string): StatementRecord[] {
  const lines = content.trim().split(/\r?\n/);
  if (!lines.length) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines
    .slice(1)
    .filter(Boolean)
    .map((line) => {
      const values = line.split(',');
      const rec: any = {};
      headers.forEach((h, i) => {
        rec[toCamel(h)] = values[i]?.trim();
      });
      return normalizeRecord(rec);
    });
}

function parseXml(content: string): StatementRecord[] {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(content, 'application/xml');
  const records = Array.from(xmlDoc.getElementsByTagName('record'));
  return records.map((r) => {
    const rec: any = {
      reference: r.getAttribute('reference') || undefined,
    };
    Array.from(r.children).forEach((child) => {
      rec[toCamel(child.tagName)] = child.textContent?.trim();
    });
    return normalizeRecord(rec);
  });
}

function normalizeRecord(rec: any): StatementRecord {
  return {
    reference: rec.reference,
    accountNumber: rec.accountNumber,
    description: rec.description,
    startBalance: rec.startBalance ? parseFloat(rec.startBalance) : undefined,
    mutation: rec.mutation ? parseFloat(rec.mutation) : undefined,
    endBalance: rec.endBalance ? parseFloat(rec.endBalance) : undefined,
  };
}

function toCamel(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^[A-Z]/, (c) => c.toLowerCase());
}
