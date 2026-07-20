import { useState, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { useAuth } from "../../context/AuthContext";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Dipanggil saat user konfirmasi. Boleh async (mis. panggil API delete). */
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Variant tombol konfirmasi. Default "destructive" karena paling sering dipakai untuk hapus data. */
  variant?: "destructive" | "primary";
}

/**
 * Dialog konfirmasi untuk aksi destruktif (hapus karyawan/produk/cabang, dsb).
 * Otomatis dicegat oleh guardMutation() dari AuthContext kalau Mode Demo aktif —
 * jadi cukup pakai komponen ini, tidak perlu cek isDemoMode manual di setiap tempat.
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Ya, Hapus",
  cancelLabel = "Batal",
  variant = "destructive",
}: ConfirmDialogProps) {
  const { guardMutation } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!guardMutation()) {
      onClose();
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirm();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-700">
          <AlertTriangle size={22} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-1000">{title}</p>
          {description && (
            <p className="mt-1 text-xs leading-relaxed text-gray-700">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-2">
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant}
          onClick={handleConfirm}
          isLoading={isSubmitting}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
