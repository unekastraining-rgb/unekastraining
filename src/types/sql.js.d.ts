declare module "sql.js" {
  export interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | Buffer) => {
      exec: (sql: string) => Array<{ columns: string[]; values: unknown[][] }>;
      close: () => void;
    };
  }
  export default function initSqlJs(config?: {
    locateFile?: (file: string) => string;
  }): Promise<SqlJsStatic>;
}
