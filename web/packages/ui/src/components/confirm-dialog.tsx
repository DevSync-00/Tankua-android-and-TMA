"use client";

import React from "react";
import { AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel?: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const handleClose = () => {
    if (onCancel) onCancel();
    if (onOpenChange) onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm();
    if (onOpenChange) onOpenChange(false);
  };

  let Icon = AlertTriangle;
  let iconColorClass = "text-amber-500 bg-amber-500/10 border-amber-500/20";
  let confirmBtnClass = "bg-amber-600 hover:bg-amber-500 text-white";

  if (variant === "danger") {
    Icon = AlertCircle;
    iconColorClass = "text-red-500 bg-red-500/10 border-red-500/20";
    confirmBtnClass = "bg-red-600 hover:bg-red-500 text-white";
  } else if (variant === "info") {
    Icon = Info;
    iconColorClass = "text-sky-500 bg-sky-500/10 border-sky-500/20";
    confirmBtnClass = "bg-sky-600 hover:bg-sky-500 text-white";
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl border ${iconColorClass} shrink-0`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 id="confirm-dialog-title" className="text-lg font-bold text-white">
              {title}
            </h3>
            <p id="confirm-dialog-desc" className="text-sm text-slate-300 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          {cancelText && (
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/50 rounded-xl transition"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-semibold rounded-xl shadow-lg transition ${confirmBtnClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
