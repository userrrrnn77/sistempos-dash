// src/pages/categories/CategoriesPage.tsx
import { useState, type FormEvent } from "react";
import { Plus, Tags, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useFetch, extractErrorMessage } from "../../hooks/useFetch";
import { categoriesService } from "../../services/categories";
import type { Category } from "../../types/api";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Table, type TableColumn } from "../../components/ui/Table";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Alert } from "../../components/ui/Alert";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/Toast";

interface CategoryFormState {
  name: string;
  /** Diketik user dipisah koma (mis. "S, M, L"), di-parse jadi array saat submit. */
  variantLabelsRaw: string;
}

const EMPTY_FORM: CategoryFormState = { name: "", variantLabelsRaw: "" };

/** Ubah "S, M,  L" jadi ["S", "M", "L"] — buang whitespace & entri kosong. */
function parseVariantLabels(raw: string): string[] {
  return raw
    .split(",")
    .map((label) => label.trim())
    .filter((label) => label.length > 0);
}

export default function CategoriesPage() {
  const { hasRole, guardMutation } = useAuth();
  const { showToast } = useToast();
  const canManage = hasRole("OWNER", "DEVELOPER");

  const {
    data: categories,
    isLoading,
    error,
    refetch,
  } = useFetch(() => categoriesService.getAll(), []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null,
  );

  const openCreateModal = () => {
    if (!guardMutation()) return;
    setEditingCategory(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    if (!guardMutation()) return;
    setEditingCategory(category);
    setForm({
      name: category.name,
      variantLabelsRaw: category.variantLabels.join(", "),
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!guardMutation()) return;

    setFormError(null);
    setIsSubmitting(true);

    const payload = {
      name: form.name,
      variantLabels: parseVariantLabels(form.variantLabelsRaw),
    };

    try {
      if (editingCategory) {
        await categoriesService.update(editingCategory._id, payload);
        showToast({
          variant: "success",
          title: "Kategori berhasil diperbarui",
        });
      } else {
        await categoriesService.create(payload);
        showToast({
          variant: "success",
          title: "Kategori baru berhasil dibuat",
        });
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
    if (!deletingCategory) return;
    try {
      await categoriesService.remove(deletingCategory._id);
      showToast({ variant: "success", title: "Kategori berhasil dihapus" });
      refetch();
    } catch (err) {
      showToast({
        variant: "error",
        title: "Gagal menghapus kategori",
        description: extractErrorMessage(err),
      });
    } finally {
      setDeletingCategory(null);
    }
  };

  const columns: TableColumn<Category>[] = [
    {
      key: "name",
      header: "Nama Kategori",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-200 text-purple-800">
            <Tags size={15} />
          </div>
          <span className="font-medium">{row.name}</span>
        </div>
      ),
    },
    {
      key: "variantLabels",
      header: "Varian",
      render: (row) =>
        row.variantLabels.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {row.variantLabels.map((label) => (
              <Badge key={label} tone="blue">
                {label}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-sm text-gray-700">
            Tanpa varian (default "-")
          </span>
        ),
    },
    ...(canManage
      ? [
          {
            key: "actions",
            header: "",
            align: "right" as const,
            render: (row: Category) => (
              <div className="flex justify-end gap-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Edit kategori"
                  onClick={() => openEditModal(row)}>
                  <Pencil size={15} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Hapus kategori"
                  onClick={() => {
                    if (!guardMutation()) return;
                    setDeletingCategory(row);
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
          <h2 className="text-lg font-semibold text-gray-1000">Kategori</h2>
          <p className="text-sm text-gray-700">
            Kelola kategori produk beserta label variannya (mis. ukuran S/M/L).
          </p>
        </div>
        {canManage && (
          <Button leftIcon={<Plus size={16} />} onClick={openCreateModal}>
            Kategori Baru
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="error" title="Gagal memuat daftar kategori">
          {error}
        </Alert>
      )}

      <Card>
        {!isLoading && !error && (categories?.length ?? 0) === 0 ? (
          <EmptyState
            icon={Tags}
            title="Belum ada kategori"
            description="Tambahkan kategori pertama supaya produk bisa dikelompokkan dan diberi varian."
            action={
              canManage && (
                <Button leftIcon={<Plus size={16} />} onClick={openCreateModal}>
                  Kategori Baru
                </Button>
              )
            }
          />
        ) : (
          <Table
            columns={columns}
            data={categories ?? []}
            isLoading={isLoading}
            getRowKey={(row) => row._id}
          />
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? "Edit Kategori" : "Kategori Baru"}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button form="category-form" type="submit" isLoading={isSubmitting}>
              {editingCategory ? "Simpan Perubahan" : "Buat Kategori"}
            </Button>
          </>
        }>
        <form
          id="category-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-4">
          {formError && (
            <Alert variant="error" title="Gagal menyimpan">
              {formError}
            </Alert>
          )}
          <Input
            label="Nama Kategori"
            placeholder="Baju, Minuman, dst"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Label Varian"
            placeholder="S, M, L, XL (kosongkan kalau produk tanpa varian)"
            helperText='Pisahkan tiap label dengan koma. Kosongkan kalau kategori ini gak punya varian — produknya bakal dapet 1 varian default "-".'
            value={form.variantLabelsRaw}
            onChange={(e) =>
              setForm({ ...form, variantLabelsRaw: e.target.value })
            }
          />
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletingCategory)}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleDelete}
        title={`Hapus kategori "${deletingCategory?.name}"?`}
        description="Aksi ini permanen dan akan dicatat di audit log. Kategori yang masih dipakai produk manapun tidak bisa dihapus — pindahkan dulu produknya ke kategori lain."
      />
    </div>
  );
}
