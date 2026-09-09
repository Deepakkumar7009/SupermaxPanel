"use client";

import { useState, useEffect, FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";

import { addAdvancePayment } from "@/redux/thunks/advancePaymentThunks";
import { fetchEmployeeById } from "@/redux/thunks/employeeThunk";
import { Employee } from "@/redux/types/employee";

import DialogModal from "@/components/common/DialogModal";
import FloatingInput from "@/components/common/FloatingInput";
import Select from "@/components/common/Select";
import Button from "@/components/common/Button";

interface Props {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  employee: Employee | null;
  selectedMonth?: string; // "1"–"12" — filters totalWorkAmount to this month
  selectedYear?: string; // "2026"
}

const AddAdvancePaymentModal = ({ isOpen, setIsOpen, employee, selectedMonth, selectedYear }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, totalAdvance, totalSalaryPaid } = useSelector(
    (state: RootState) => state.advancePayment,
  );

  /* total earned from work entries for selected month (only WORK status) */
  const { totalWorkAmount } = useSelector((state: RootState) => state.work);

  /* net to pay = work earned − advance given − salary already paid */
  const netToPay = Math.max(0, totalWorkAmount - totalAdvance - totalSalaryPaid);

  const [type, setType] = useState<"ADVANCE" | "SALARY_PAYMENT">("ADVANCE");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");

  /* ---- when type switches to SALARY_PAYMENT, pre-fill the net to pay ---- */
  useEffect(() => {
    if (type === "SALARY_PAYMENT" && netToPay > 0) {
      setAmount(String(netToPay));
    } else if (type === "ADVANCE") {
      setAmount("");
    }
  }, [type, netToPay]);

  /* ---- reset form when modal closes ---- */
  useEffect(() => {
    if (!isOpen) {
      setType("ADVANCE");
      setAmount("");
      setDate("");
      setNote("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!employee || !amount || !date) {
      alert("Please fill all required fields");
      return;
    }

    const result = await dispatch(
      addAdvancePayment({
        employee: employee._id,
        type,
        amount: Number(amount),
        date,
        note: note || undefined,
      }),
    );

    if (addAdvancePayment.fulfilled.match(result)) {
      /* re-fetch employee so profile card counters (advancePayment/paidPayment) stay in sync */
      dispatch(fetchEmployeeById(employee._id));
      setIsOpen(false);
    }
  };

  return (
    <DialogModal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title={`Payment — ${employee?.name}`}
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>

        <Select
          value={type}
          onChange={(v) => setType(v as "ADVANCE" | "SALARY_PAYMENT")}
          options={[
            { label: "Give Advance", value: "ADVANCE" },
            { label: "Pay for Work", value: "SALARY_PAYMENT" },
          ]}
          placeholder="Payment Type"
          className="w-full max-w-full"
        />

        {/* ---- info banner when paying salary ---- */}
        {type === "SALARY_PAYMENT" && (
          <div className="rounded-md px-3 py-2 text-sm bg-[color:var(--color-banner-warning-bg)] border border-[color:var(--color-banner-warning-border)] text-[color:var(--color-banner-warning-text)]">
            {selectedMonth && (
              <p className="text-xs font-semibold mb-1 text-[color:var(--color-banner-warning-label)]">
                Showing for: {new Date(Number(selectedYear), Number(selectedMonth) - 1).toLocaleString("default", { month: "long" })} {selectedYear}
              </p>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <span><span className="font-semibold">Work earned:</span> ₹{totalWorkAmount}</span>
              <span><span className="font-semibold">Advance given:</span> ₹{totalAdvance}</span>
              <span><span className="font-semibold">Salary paid:</span> ₹{totalSalaryPaid}</span>
            </div>
            <p className="text-xs mt-1 font-semibold">
              Net to pay: ₹{totalWorkAmount} − ₹{totalAdvance} − ₹{totalSalaryPaid} = ₹{netToPay}
            </p>
            <p className="text-xs mt-0.5 text-[color:var(--color-banner-warning-label)]">
              Amount is pre-filled. You can edit it before saving.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FloatingInput
            label="Amount (₹)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <FloatingInput
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <FloatingInput
          label="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </DialogModal>
  );
};

export default AddAdvancePaymentModal;
