"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // ensure you have shadcn/ui installed
import { ReactNode } from "react";

interface DialogModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  title: string;
  className?: string;
  children: ReactNode;
}

const DialogModal = ({ isOpen, setIsOpen, title, children }: DialogModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-3xl w-full rounded-lg p-6" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
};

export default DialogModal;
