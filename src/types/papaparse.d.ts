declare module 'papaparse' {
  interface ParseConfig<T = unknown> {
    header?: boolean;
    skipEmptyLines?: boolean;
    complete?: (results: ParseResult<T>) => void;
    error?: (error: Error) => void;
  }

  interface ParseResult<T = unknown> {
    data: T[];
    errors: Array<{ message: string; row?: number }>;
    meta: {
      fields?: string[];
      delimiter: string;
      linebreak: string;
      aborted: boolean;
      truncated: boolean;
    };
  }

  function parse<T = unknown>(input: File | string, config?: ParseConfig<T>): void;

  export default { parse };
  export { parse, ParseConfig, ParseResult };
}
