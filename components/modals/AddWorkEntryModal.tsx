"use client";

import { useState, useEffect, FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";

import { createWorkEntry, updateWorkEntry, fetchWorkEntries } from "@/redux/thunks/workThunk";
import { Employee } from "@/redux/types/employee";
import { WorkEntry } from "@/redux/types/work";

import DialogModal from "@/components/common/DialogModal";
import FloatingInput from "@/components/common/FloatingInput";
import Button from "@/components/common/Button";

interface Props {
  isOpen:    boolean;
  setIsOpen: (open: boolean) => void;
  employee:  Employee | null;
  entry?:    WorkEntry | null; // if provided → edit mode
}

const AddWorkEntryModal = ({ isOpen, setIsOpen, employee, entry }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { page, limit, loading } = useSelector((state: RootState) => state.work);

  const [date,     setDate]     = useState("");
  const [quantity, setQuantity] = useState("");
  const [amount,   setAmount]   = useState("");

  /* ---- populate fields in edit mode ---- */
  useEffect(() => {
    if (entry) {
      setDate(entry.date?.slice(0, 10) || "");
      setQuantity(entry.quantity != null ? String(entry.quantity) : "");
      setAmount(entry.amount   != null ? String(entry.amount)   : "");
    } else {
      setDate("");
      setQuantity("");
      setAmount("");
    }
  }, [entry]);

  /* ---- reset on close ---- */
  useEffect(() => {
    if (!isOpen) {
      setDate("");
      setQuantity("");
      setAmount("");
    }
  }, [isOpen]);

  /* ---- mark a WORK entry as Work Off (clear qty + amount) ---- */
  const handleMarkWorkOff = async () => {
    if (!entry) return;
    const result = await dispatch(
      updateWorkEntry({
        id:       entry._id,
        date,
        quantity: undefined,
        amount:   undefined,
      }),
    );
    if (updateWorkEntry.fulfilled.match(result)) setIsOpen(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!employee || !date) {
      alert("Please select a date");
      return;
    }

    /* filling a WORK_OFF entry requires at least one of quantity or amount */
    if (entry?.status === "WORK_OFF" && !quantity && !amount) {
      alert("Please enter quantity or amount to mark as Work");
      return;
    }

    let result;

    if (entry) {
      /* ---- EDIT / FILL ---- */
      result = await dispatch(
        updateWorkEntry({
          id:       entry._id,
          date,
          quantity: quantity ? Number(quantity) : undefined,
          amount:   amount   ? Number(amount)   : undefined,
        }),
      );
      if (updateWorkEntry.fulfilled.match(result)) {
        setIsOpen(false);
      }
    } else {
      /* ---- CREATE ---- */
      result = await dispatch(
        createWorkEntry({
          employee: employee._id,
          date,
          quantity: quantity ? Number(quantity) : undefined,
          amount:   amount   ? Number(amount)   : undefined,
        }),
      );
      if (createWorkEntry.fulfilled.match(result)) {
        dispatch(fetchWorkEntries({ employeeId: employee._id, page, limit }));
        setIsOpen(false);
      }
    }
  };

  return (
    <DialogModal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title={
        entry?.status === "WORK_OFF"
          ? `Fill Work Entry — ${employee?.name}`
          : entry
          ? `Edit Work Entry — ${employee?.name}`
          : `Add Work Entry — ${employee?.name}`
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <FloatingInput
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          label="Date"
        />

        <div className="grid grid-cols-2 gap-4">
          <FloatingInput
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            label="Quantity"
          />
          <FloatingInput
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            label="Amount"
          />
        </div>

        <div className="flex justify-between gap-2">
          {/* show "Mark as Work Off" only when editing a WORK entry */}
          {entry?.status === "WORK" && (
            <Button
              type="button"
              disabled={loading}
              onClick={handleMarkWorkOff}
              className="text-[color:var(--color-btn-danger-text)] border-[color:var(--color-btn-danger-border)] hover:bg-[color:var(--color-btn-danger-hover-bg)]"
            >
              Mark as Work Off
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button type="button" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : entry ? "Save" : "Add"}
            </Button>
          </div>
        </div>
      </form>
    </DialogModal>
  );
};

export default AddWorkEntryModal;
