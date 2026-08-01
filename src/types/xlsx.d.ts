declare module 'xlsx' {
  export interface WorkBook {
    SheetNames: string[];
    Sheets: { [sheet: string]: WorkSheet };
  }

  export interface WorkSheet {
    [cell: string]: CellObject | unknown;
  }

  export interface CellObject {
    t: string;
    v: string | number | boolean | Date;
    w?: string;
  }

  export interface ParsingOptions {
    type?: 'array' | 'string' | 'buffer' | 'base64' | 'binary' | 'file';
    raw?: boolean;
    dense?: boolean;
    sheetRows?: number;
  }

  export interface Sheet2JSONOpts {
    header?: number | string[];
    defval?: unknown;
    raw?: boolean;
    dateNF?: string;
    blankrows?: boolean;
  }

  export function read(data: unknown, opts?: ParsingOptions): WorkBook;
  export function readFile(filename: string, opts?: ParsingOptions): WorkBook;

  export const utils: {
    sheet_to_json<T = Record<string, unknown>>(
      worksheet: WorkSheet,
      opts?: Sheet2JSONOpts
    ): T[];
    json_to_sheet(data: unknown[], opts?: unknown): WorkSheet;
    aoa_to_sheet(data: unknown[][], opts?: unknown): WorkSheet;
    decode_range(range: string): { s: { c: number; r: number }; e: { c: number; r: number } };
  };
}
