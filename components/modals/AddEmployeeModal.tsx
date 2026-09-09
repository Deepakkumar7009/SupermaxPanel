"use client";

import { useState } from "react";
import DialogModal from "@/components/common/DialogModal";
import Button from "@/components/common/Button";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { createEmployee, fetchEmployees } from "@/redux/thunks/employeeThunk";
import FloatingInput from "../common/FloatingInput";

interface AddEmployeeModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const AddEmployeeModal = ({ isOpen, setIsOpen }: AddEmployeeModalProps) => {
  const dispatch = useDispatch<AppDispatch>();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const handleSubmit = async () => {
    if (!name || !email || !phone) {
      alert("Please fill in all required fields");
      return;
    }

    await dispatch(
      createEmployee({
        name,
        email,
        phone,
        address: address || undefined,
      })
    );

    dispatch(fetchEmployees({ page: 1, limit: 10 }));

    setIsOpen(false);
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
  };

  return (
    <DialogModal isOpen={isOpen} setIsOpen={setIsOpen} title="Add New Employee">
      <div className="space-y-4">
        <FloatingInput label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <FloatingInput label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <FloatingInput label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <FloatingInput label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />

        <div className="flex justify-end gap-2">
          <Button onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Add Employee</Button>
        </div>
      </div>
    </DialogModal>
  );
};

export default AddEmployeeModal;
