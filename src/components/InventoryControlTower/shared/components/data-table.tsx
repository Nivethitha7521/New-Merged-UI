import { ReactNode } from "react";

export function DataTable({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return (
    <>
      <div className="hidden overflow-x-auto ct-scrollbar-thin md:block">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50/90 text-[10px] uppercase tracking-[0.08em] text-slate-500">
            <tr>
              {headers.map((h) => (
                <th key={h} className="whitespace-nowrap px-4 py-3.5 font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, i) => (
              <tr key={i} className="transition hover:bg-indigo-50/30">
                {row.map((cell, j) => (
                  <td key={j} className="whitespace-nowrap px-4 py-3.5 text-slate-700 first:text-slate-950">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-100 md:hidden">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="p-3.5">
            <div className="mb-3 min-w-0 text-sm font-bold text-slate-950">{row[0]}</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
              {row.slice(1, -1).map((cell, cellIndex) => (
                <div key={cellIndex} className="min-w-0 rounded-xl bg-slate-50/80 px-2.5 py-2">
                  <div className="truncate text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
                    {headers[cellIndex + 1]}
                  </div>
                  <div className="mt-1 min-w-0 overflow-hidden text-xs font-medium text-slate-700">{cell}</div>
                </div>
              ))}
            </div>
            {headers.length > 1 ? (
              <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-100 px-2.5 py-2">
                <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">{headers[headers.length - 1]}</span>
                <div>{row[row.length - 1]}</div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </>
  );
}
