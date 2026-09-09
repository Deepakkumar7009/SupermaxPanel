"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

import DialogModal from "@/components/common/DialogModal";
import Button from "@/components/common/Button";
import AddWorkEntryModal from "@/components/modals/AddWorkEntryModal";
import { WorkEntry } from "@/redux/types/work";
import { Employee } from "@/redux/types/employee";

interface Props {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  entryId: string | null;
  employee: Employee | null;
}

const WorkEntryViewModal = ({ isOpen, setIsOpen, entryId, employee }: Props) => {
  const [editOpen, setEditOpen] = useState(false);

  /* live entry from Redux */
  const entry = useSelector((state: RootState) =>
    state.work.entries.find((e) => e._id === entryId),
  );

  /* snapshot — holds last known entry so edit modal keeps its data
     even after isOpen becomes false and entry disappears            */
  const [snapshot, setSnapshot] = useState<WorkEntry | undefined>(undefined);

  useEffect(() => {
    if (entry) setSnapshot(entry);
  }, [entry]);

  return (
    <>
      <DialogModal isOpen={isOpen} setIsOpen={setIsOpen} title="Work Entry Details">
        {snapshot && (
          <div className="grid grid-cols-2 gap-4">
            <Info label="Date" value={new Date(snapshot.date).toLocaleDateString()} />
            <Info label="Status" value={snapshot.status} />
            <Info label="Quantity" value={snapshot.quantity != null ? String(snapshot.quantity) : "—"} />
            <Info label="Amount" value={snapshot.amount != null ? `₹ ${snapshot.amount}` : "—"} />
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <Button
            onClick={() => {
              setIsOpen(false);
              setEditOpen(true);
            }}
          >
            Edit
          </Button>
          <Button onClick={() => setIsOpen(false)}>Close</Button>
        </div>
      </DialogModal>

      {/* always mounted — snapshot keeps data alive for the edit modal */}
      <AddWorkEntryModal
        isOpen={editOpen}
        setIsOpen={setEditOpen}
        employee={employee}
        entry={snapshot ?? null}
      />
    </>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
    <p className="font-medium">{value}</p>
  </div>
);

export default WorkEntryViewModal;
