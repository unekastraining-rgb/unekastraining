"use client";

import { Plus, Trash2 } from "lucide-react";

import type { ChartingData } from "@/lib/core/note-types";
import { emptyCharting } from "@/lib/core/note-types";

export { emptyCharting };

export function ChartingEditor({
  data,
  onChange,
  bare = false,
}: {
  data: ChartingData;
  onChange: (data: ChartingData) => void;
  bare?: boolean;
}) {
  const updateColumn = (index: number, value: string) => {
    const columns = [...data.columns];
    columns[index] = value;
    onChange({ ...data, columns });
  };

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const rows = data.rows.map((row, index) =>
      index === rowIndex
        ? row.map((cell, cellIndex) => (cellIndex === colIndex ? value : cell))
        : row,
    );
    onChange({ ...data, rows });
  };

  const addColumn = () => {
    onChange({
      columns: [...data.columns, `Column ${data.columns.length + 1}`],
      rows: data.rows.map((row) => [...row, ""]),
    });
  };

  const addRow = () => {
    onChange({
      ...data,
      rows: [...data.rows, data.columns.map(() => "")],
    });
  };

  const removeRow = (rowIndex: number) => {
    onChange({ ...data, rows: data.rows.filter((_, index) => index !== rowIndex) });
  };

  const removeColumn = (colIndex: number) => {
    if (data.columns.length <= 1) return;
    onChange({
      columns: data.columns.filter((_, index) => index !== colIndex),
      rows: data.rows.map((row) => row.filter((_, index) => index !== colIndex)),
    });
  };

  return (
    <div
      className={
        bare
          ? "flex h-full min-h-0 flex-col gap-1 px-0.5 py-0.5"
          : "flex h-full min-h-[24rem] flex-col gap-3 p-4"
      }
    >
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={addColumn}
          className={
            bare
              ? "inline-flex items-center gap-1 text-[10px] font-semibold text-stone-400 hover:text-teal-700"
              : "inline-flex items-center gap-1 rounded-lg border border-orange-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700"
          }
        >
          <Plus className="h-3.5 w-3.5" /> Column
        </button>
        <button
          type="button"
          onClick={addRow}
          className={
            bare
              ? "inline-flex items-center gap-1 text-[10px] font-semibold text-stone-400 hover:text-teal-700"
              : "inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white"
          }
        >
          <Plus className="h-3.5 w-3.5" /> Row
        </button>
      </div>

      <div
        className={
          bare
            ? "min-h-0 flex-1 overflow-auto"
            : "overflow-auto rounded-xl border border-orange-100"
        }
      >
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className={bare ? "" : "bg-teal-50"}>
              {data.columns.map((column, colIndex) => (
                <th
                  key={colIndex}
                  className={bare ? "border-b border-stone-200/70 p-0" : "border border-orange-100 p-0"}
                >
                  <div className="flex items-center gap-1">
                    <input
                      value={column}
                      onChange={(event) => updateColumn(colIndex, event.target.value)}
                      className={
                        bare
                          ? "w-full bg-transparent px-1 py-1 text-left text-[10px] font-semibold uppercase tracking-wide text-stone-400 outline-none"
                          : "w-full bg-transparent px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-teal-800 outline-none"
                      }
                    />
                    <button
                      type="button"
                      onClick={() => removeColumn(colIndex)}
                      className="mr-1 rounded p-1 text-stone-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <td
                    key={colIndex}
                    className={bare ? "border-b border-stone-100 p-0" : "border border-orange-100 p-0"}
                  >
                    <textarea
                      value={cell}
                      onChange={(event) => updateCell(rowIndex, colIndex, event.target.value)}
                      rows={bare ? 1 : 2}
                      className={
                        bare
                          ? "min-h-0 w-full resize-none bg-transparent px-1 py-1 text-sm outline-none"
                          : "min-h-[3rem] w-full resize-none bg-white px-3 py-2 text-sm outline-none focus:bg-orange-50/40"
                      }
                    />
                  </td>
                ))}
                <td className={bare ? "p-0.5" : "border border-orange-100 p-1"}>
                  <button
                    type="button"
                    onClick={() => removeRow(rowIndex)}
                    className="rounded p-1 text-stone-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
