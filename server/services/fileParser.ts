import * as XLSX from 'xlsx';
import csv from 'csv-parser';
import * as mammoth from 'mammoth';
import { Readable } from 'stream';

export interface ParsedData {
  data: any[][];
  headers: string[];
  metadata: {
    totalRows: number;
    totalColumns: number;
    fileType: string;
    fileName: string;
  };
}

export class FileParser {
  async parseFile(buffer: Buffer, fileName: string, mimeType: string): Promise<ParsedData> {
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    
    try {
      switch (fileExtension) {
        case 'csv':
          return await this.parseCsv(buffer, fileName);
        case 'xlsx':
        case 'xls':
          return await this.parseExcel(buffer, fileName);
        case 'pdf':
          return await this.parsePdf(buffer, fileName);
        case 'doc':
        case 'docx':
          return await this.parseWord(buffer, fileName);
        default:
          throw new Error(`Unsupported file format: ${fileExtension}`);
      }
    } catch (error) {
      throw new Error(`Failed to parse file: ${error.message}`);
    }
  }

  private async parseCsv(buffer: Buffer, fileName: string): Promise<ParsedData> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      let headers: string[] = [];
      
      const stream = Readable.from(buffer.toString());
      stream
        .pipe(csv())
        .on('headers', (headerList) => {
          headers = headerList;
        })
        .on('data', (data) => {
          results.push(Object.values(data));
        })
        .on('end', () => {
          resolve({
            data: results,
            headers,
            metadata: {
              totalRows: results.length,
              totalColumns: headers.length,
              fileType: 'csv',
              fileName
            }
          });
        })
        .on('error', reject);
    });
  }

  private async parseExcel(buffer: Buffer, fileName: string): Promise<ParsedData> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const headers = jsonData[0] as string[];
    const data = jsonData.slice(1) as any[][];
    
    return {
      data,
      headers,
      metadata: {
        totalRows: data.length,
        totalColumns: headers.length,
        fileType: 'excel',
        fileName
      }
    };
  }

  private async parsePdf(buffer: Buffer, fileName: string): Promise<ParsedData> {
    const pdfParse = await import('pdf-parse');
    const pdfData = await pdfParse.default(buffer);
    const text = pdfData.text;
    
    // Simple text parsing - look for tabular data
    const lines = text.split('\n').filter(line => line.trim());
    const data: string[][] = [];
    let headers: string[] = [];
    
    // Try to detect tabular structure
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const cells = line.split(/\s{2,}|\t/).filter(cell => cell.trim());
        if (cells.length > 1) {
          if (i === 0) {
            headers = cells;
          } else {
            data.push(cells);
          }
        }
      }
    }
    
    // If no tabular structure found, treat as single column text data
    if (data.length === 0) {
      headers = ['Text'];
      data.push(...lines.map(line => [line]));
    }
    
    return {
      data,
      headers,
      metadata: {
        totalRows: data.length,
        totalColumns: headers.length,
        fileType: 'pdf',
        fileName
      }
    };
  }

  private async parseWord(buffer: Buffer, fileName: string): Promise<ParsedData> {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    
    const lines = text.split('\n').filter(line => line.trim());
    const data: string[][] = [];
    let headers: string[] = [];
    
    // Try to detect tabular structure
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const cells = line.split(/\s{2,}|\t/).filter(cell => cell.trim());
        if (cells.length > 1) {
          if (i === 0) {
            headers = cells;
          } else {
            data.push(cells);
          }
        }
      }
    }
    
    // If no tabular structure found, treat as single column text data
    if (data.length === 0) {
      headers = ['Text'];
      data.push(...lines.map(line => [line]));
    }
    
    return {
      data,
      headers,
      metadata: {
        totalRows: data.length,
        totalColumns: headers.length,
        fileType: 'word',
        fileName
      }
    };
  }
}
