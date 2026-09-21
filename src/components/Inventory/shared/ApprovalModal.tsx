import React, { useState } from "react";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import { Modal } from "@/components/ui/Modal";

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mode: "ADJUST_SYSTEM" | "KEEP_SYSTEM", description: string) => void;
  systemStock: number | string;
  physicalStock: number | string;
  variance: number | string;
  itemName: string;
  isLoading?: boolean;
}

export function ApprovalModal({
  isOpen,
  onClose,
  onConfirm,
  systemStock,
  physicalStock,
  variance,
  itemName,
  isLoading = false,
}: ApprovalModalProps) {
  const [description, setDescription] = useState("");

  const handleConfirm = (mode: "ADJUST_SYSTEM" | "KEEP_SYSTEM") => {
    onConfirm(mode, description);
  };
  // newly add this part 31 7 1
  const formatValue = (value: number | string) => {
  const num = Number(value);
  return Number.isFinite(num)
    ? num.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : value;
};
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="lg"
      className="!p-0"
    >
      <div className="border-b border-border p-5 flex items-center justify-between bg-slate-50/50">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 m-0">
          <FactCheckOutlinedIcon className="w-5 h-5 text-brand-600" />
          Approve Variance
        </h3>
      </div>

      <div className="p-6">
        <p className="text-slate-600 mb-6 leading-relaxed text-[13px]">
          You are about to approve the variance for <span className="font-semibold text-slate-800">{itemName}</span>. 
          Please choose how you want to adjust the system stock.
        </p>

        <div className="bg-slate-50 rounded-xl border border-slate-200 mb-8 grid grid-cols-3 overflow-hidden">
          <div className="flex flex-col items-center justify-center py-5 px-4 text-center">
            <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-1">System Stock</div>
            <div className="text-xl font-semibold text-slate-800">{formatValue(systemStock)}</div>
          </div>
          <div className="flex flex-col items-center justify-center py-5 px-4 text-center">
            <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-1">Physical Stock</div>
            <div className="text-xl font-semibold text-slate-800">{formatValue(physicalStock)}</div>
          </div>
          <div className="flex flex-col items-center justify-center py-5 px-4 text-center">
            <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-1">Variance</div>
            <div className={`text-xl font-semibold ${typeof variance === 'number' && variance < 0 ? 'text-danger-600' : typeof variance === 'number' && variance > 0 ? 'text-success-600' : 'text-slate-800'}`}>
              {/* replace the part 31 7 1 */}
              {typeof variance === "number"
  ? `${variance > 0 ? "+" : ""}${formatValue(variance)}`
  : variance}
            </div>
          </div>
        </div>
{/* comment this part because no need of this part 31 7 1 */}
        {/* <div className="mb-6">
          <label className="block text-[13px] font-semibold text-slate-700 mb-2">
            Approval Remarks (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add any notes about this approval..."
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] shadow-sm placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
          />
        </div> */}

        <div className="flex justify-center mt-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleConfirm("ADJUST_SYSTEM")}
            className="w-full max-w-[280px] flex flex-col items-center justify-center p-4 border-2 border-brand-200 rounded-xl hover:border-brand-500 hover:bg-brand-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="font-semibold text-brand-700 mb-1">Accept Physical Count</span>
            <span className="text-[11px] text-slate-500 text-center">Adjust the system stock</span>
          </button>
          {/* rempove this button 31 7 1 */}
          {/* <button
            type="button"
            disabled={isLoading}
            onClick={() => handleConfirm("KEEP_SYSTEM")}
            className="flex flex-col items-center p-4 border-2 border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="font-semibold text-slate-700 mb-1">Reject Physical Count</span>
            <span className="text-[11px] text-slate-500 text-center">Keep system stock unchanged</span>
          </button> */}
        </div>
      </div>
    </Modal>
  );
}
