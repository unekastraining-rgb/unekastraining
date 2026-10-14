declare module "sql.js" {
  export interface SqlJsDatabase {
    exec: (sql: string) => Array<{ columns: string[]; values: unknown[][] }>;
    run: (sql: string) => void;
    close: () => void;
  }
  export interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | Buffer) => SqlJsDatabase;
  }
  export default function initSqlJs(config?: {
    locateFile?: (file: string) => string;
    wasmBinary?: ArrayBuffer | Buffer | Uint8Array;
  }): Promise<SqlJsStatic>;
}
