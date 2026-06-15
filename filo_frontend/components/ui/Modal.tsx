"use client";

import { XIcon } from "lucide-react";
import React from "react";

interface Props {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  onClose?: () => void;
  modalRef?: React.RefObject<HTMLDialogElement | null>;
  maxWidth?: string;
}

const Modal = React.forwardRef<HTMLDialogElement, Props>(
  ({ children, title, subtitle, onClose, modalRef, maxWidth = "max-w-md" }, ref) => {
    const handleDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
      const dims = modalRef?.current?.getBoundingClientRect();
      if (
        dims &&
        (e.clientX < dims.left || e.clientX > dims.right || e.clientY < dims.top || e.clientY > dims.bottom)
      ) {
        modalRef?.current?.close();
      }
    };

    return (
      <dialog
        ref={ref}
        onClick={handleDialogClick}
        onClose={onClose}
        className={`bg-surface border-border m-auto rounded-xl w-full ${maxWidth} animate-slide-up`}
      >
        <div className="w-full">
          <div className="border-b border-border p-5 pb-4 space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display font-bold text-text">{title}</h3>
              <button
                onClick={() => {
                  modalRef?.current?.close();
                }}
                className="border-none text-text-muted cursor-pointer"
              >
                <XIcon className="size-5" />
              </button>
            </div>
            {subtitle && <p className="text-sm text-text-muted">{subtitle}</p>}
          </div>

          <div className="p-5">{children}</div>
        </div>
      </dialog>
    );
  },
);

Modal.displayName = "Modal";
export default Modal;
