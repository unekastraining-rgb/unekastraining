"use client";

import { Plus, Trash2 } from "lucide-react";

import type { ChartingData } from "@/lib/core/note-types";
import { emptyCharting } from "@/lib/core/note-types";

export { emptyCharting };

export function ChartingEditor({
  data,
  onChange,
}: {
  data: ChartingData;
  onChange: (data: ChartingData) => void;
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
    <div className="flex h-full min-h-[24rem] flex-col gap-3 p-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={addColumn}
          className="inline-flex items-center gap-1 rounded-lg border border-orange-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700"
        >
          <Plus className="h-3.5 w-3.5" /> Column
        </button>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white"
        >
          <Plus className="h-3.5 w-3.5" /> Row
        </button>
      </div>

      <div className="overflow-auto rounded-xl border border-orange-100">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-teal-50">
              {data.columns.map((column, colIndex) => (
                <th key={colIndex} className="border border-orange-100 p-0">
                  <div className="flex items-center gap-1">
                    <input
                      value={column}
                      onChange={(event) => updateColumn(colIndex, event.target.value)}
                      className="w-full bg-transparent px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-teal-800 outline-none"
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
                  <td key={colIndex} className="border border-orange-100 p-0">
                    <textarea
                      value={cell}
                      onChange={(event) => updateCell(rowIndex, colIndex, event.target.value)}
                      rows={2}
                      className="min-h-[3rem] w-full resize-none bg-white px-3 py-2 text-sm outline-none focus:bg-orange-50/40"
                    />
                  </td>
                ))}
                <td className="border border-orange-100 p-1">
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
