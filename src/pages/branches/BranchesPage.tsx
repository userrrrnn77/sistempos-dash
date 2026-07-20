// src/pages/branches/BranchesPage.tsx
import { useState, type FormEvent } from "react";
import { Plus, Store, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useFetch, extractErrorMessage } from "../../hooks/useFetch";
import { branchesService } from "../../services/branches";
import type { Branch } from "../../types/api";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Table, type TableColumn } from "../../components/ui/Table";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Alert } from "../../components/ui/Alert";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/Toast";

interface BranchFormState {
  name: string;
  address: string;
  phone: string;
}

const EMPTY_FORM: BranchFormState = { name: "", address: "", phone: "" };

export default function BranchesPage() {
  const { hasRole, guardMutation } = useAuth();
  const { showToast } = useToast();
  const canManage = hasRole("OWNER", "DEVELOPER");

  const {
    data: branches,
    isLoading,
    error,
    refetch,
  } = useFetch(() => branchesService.getAll(), []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [form, setForm] = useState<BranchFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);

  const openCreateModal = () => {
    if (!guardMutation()) return;
    setEditingBranch(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (branch: Branch) => {
    if (!guardMutation()) return;
    setEditingBranch(branch);
    setForm({
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!guardMutation()) return;

    setFormError(null);
    setIsSubmitting(true);

    try {
      if (editingBranch) {
        await branchesService.update(editingBranch._id, form);
        showToast({
          variant: "success",
          title: "Cabang berhasil diperbarui",
        });
      } else {
        await branchesService.create(form);
        showToast({ variant: "success", title: "Cabang baru berhasil dibuat" });
      }
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      setFormError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingBranch) return;
    try {
      await branchesService.remove(deletingBranch._id);
      showToast({ variant: "success", title: "Cabang berhasil dihapus" });
      refetch();
    } catch (err) {
      showToast({
        variant: "error",
        title: "Gagal menghapus cabang",
        description: extractErrorMessage(err),
      });
    } finally {
      setDeletingBranch(null);
    }
  };

  const columns: TableColumn<Branch>[] = [
    {
      key: "name",
      header: "Nama Cabang",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-200 text-blue-800">
            <Store size={15} />
          </div>
          <span className="font-medium">{row.name}</span>
        </div>
      ),
    },
    {
      key: "code",
      header: "Kode",
      render: (row) => <Badge tone="blue">{row.code}</Badge>,
    },
    {
      key: "address",
      header: "Alamat",
      render: (row) => <span className="text-gray-800">{row.address}</span>,
      hideOnMobile: true,
    },
    {
      key: "phone",
      header: "Telepon",
      render: (row) => <span className="text-gray-800">{row.phone}</span>,
      hideOnMobile: true,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge tone={row.isActive ? "green" : "gray"} dot>
          {row.isActive ? "Aktif" : "Nonaktif"}
        </Badge>
      ),
    },
    ...(canManage
      ? [
          {
            key: "actions",
            header: "",
            align: "right" as const,
            render: (row: Branch) => (
              <div className="flex justify-end gap-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Edit cabang"
                  onClick={() => openEditModal(row)}>
                  <Pencil size={15} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Hapus cabang"
                  onClick={() => {
                    if (!guardMutation()) return;
                    setDeletingBranch(row);
                  }}>
                  <Trash2 size={15} className="text-red-700" />
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-1000">Cabang</h2>
          <p className="text-sm text-gray-700">
            Kelola daftar cabang toko yang beroperasi.
          </p>
        </div>
        {canManage && (
          <Button leftIcon={<Plus size={16} />} onClick={openCreateModal}>
            Cabang Baru
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="error" title="Gagal memuat daftar cabang">
          {error}
        </Alert>
      )}

      <Card>
        {!isLoading && !error && (branches?.length ?? 0) === 0 ? (
          <EmptyState
            icon={Store}
            title="Belum ada cabang"
            description="Tambahkan cabang pertama untuk mulai alokasi stok dan transaksi."
            action={
              canManage && (
                <Button leftIcon={<Plus size={16} />} onClick={openCreateModal}>
                  Cabang Baru
                </Button>
              )
            }
          />
        ) : (
          <Table
            columns={columns}
            data={branches ?? []}
            isLoading={isLoading}
            getRowKey={(row) => row._id}
          />
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBranch ? "Edit Cabang" : "Cabang Baru"}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button form="branch-form" type="submit" isLoading={isSubmitting}>
              {editingBranch ? "Simpan Perubahan" : "Buat Cabang"}
            </Button>
          </>
        }>
        <form
          id="branch-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-4">
          {formError && (
            <Alert variant="error" title="Gagal menyimpan">
              {formError}
            </Alert>
          )}
          <Input
            label="Nama Cabang"
            placeholder="Cabang Bandung Kota"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Textarea
            label="Alamat"
            placeholder="Jl. Braga No. 10, Bandung"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            required
          />
          <Input
            label="Nomor Telepon"
            type="tel"
            placeholder="022-1234567"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
          {!editingBranch && (
            <p className="-mt-1 text-xs text-gray-700">
              Kode cabang dibuat otomatis dari nama (mis. "Bandung Kota" →
              BAN-01).
            </p>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletingBranch)}
        onClose={() => setDeletingBranch(null)}
        onConfirm={handleDelete}
        title={`Hapus cabang "${deletingBranch?.name}"?`}
        description="Aksi ini permanen dan akan dicatat di audit log. Produk yang teralokasi di cabang ini tidak akan otomatis terhapus."
      />
    </div>
  );
}
