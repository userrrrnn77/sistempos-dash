// src/pages/products/ProductsPage.tsx
import { useMemo, useState, type FormEvent } from "react";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  PackagePlus,
  Search,
  ImagePlus,
  Star,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useFetch, extractErrorMessage } from "../../hooks/useFetch";
import { productsService } from "../../services/products";
import { branchesService } from "../../services/branches";
import { categoriesService } from "../../services/categories";
import type { Product } from "../../types/api";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Table, type TableColumn } from "../../components/ui/Table";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Select } from "../../components/ui/Select";
import { Alert } from "../../components/ui/Alert";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { Badge } from "../../components/ui/Badge";
import { useToast } from "../../components/ui/Toast";

/** Label default varian untuk produk dari kategori yang gak punya varian (samain dengan backend). */
const DEFAULT_VARIANT_LABEL = "-";

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Total qty semua varian & semua cabang buat satu produk. */
function getTotalStock(product: Product): number {
  return product.variants.reduce(
    (sum, variant) => sum + variant.stocks.reduce((vSum, s) => vSum + s.qty, 0),
    0,
  );
}

/** Berapa banyak alokasi cabang yang aktif (dijumlah lintas semua varian). */
function getBranchAllocationCount(product: Product): number {
  return product.variants.reduce(
    (sum, variant) => sum + variant.stocks.length,
    0,
  );
}

/** categoryId bisa berupa string mentah atau object hasil populate, tergantung endpoint. */
function getCategoryId(product: Product): string {
  return typeof product.categoryId === "string"
    ? product.categoryId
    : product.categoryId._id;
}

/** Batas jumlah gambar yang bisa dipilih sekaligus dalam satu aksi upload. */
const MAX_IMAGES_PER_UPLOAD = 5;

/**
 * Upload tiap file langsung ke presigned URL R2 (PUT, bukan lewat backend & bukan lewat
 * instance axios `api` — instance itu otomatis nyisipin Authorization header & Content-Type
 * json yang justru bakal bikin signature presigned URL R2 gak cocok).
 * Urutan `files` HARUS sama persis dengan urutan `imageTypes` yang dikirim ke backend,
 * karena `uploadUrls` dikembalikan backend dengan urutan yang sama.
 */
async function uploadImagesToPresignedUrls(
  files: File[],
  uploadUrls: string[],
): Promise<void> {
  await Promise.all(
    files.map((file, index) =>
      fetch(uploadUrls[index], {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      }).then((res) => {
        if (!res.ok) {
          throw new Error(`Gagal upload gambar "${file.name}" ke storage.`);
        }
      }),
    ),
  );
}

interface ProductFormState {
  name: string;
  sku: string;
  description: string;
  price: string;
  categoryId: string;
  // Stok awal (opsional, cuma dipakai saat create — masuk ke varian pertama kategori terpilih)
  branchId: string;
  initialQty: string;
}

const EMPTY_FORM: ProductFormState = {
  name: "",
  sku: "",
  description: "",
  price: "",
  categoryId: "",
  branchId: "",
  initialQty: "",
};

export default function ProductsPage() {
  const { hasRole, guardMutation } = useAuth();
  const { showToast } = useToast();
  const canManage = hasRole("OWNER", "DEVELOPER");
  const canAdjustStock = hasRole("OWNER", "DEVELOPER", "CASHIER");

  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");

  const { data: branches } = useFetch(() => branchesService.getAll(), []);
  const { data: categories } = useFetch(() => categoriesService.getAll(), []);

  const {
    data: products,
    isLoading,
    error,
    refetch,
  } = useFetch(
    () =>
      productsService.getAll({
        search: search || undefined,
        branchId: branchFilter || undefined,
      }),
    [search, branchFilter],
  );

  const branchMap = useMemo(() => {
    const map = new Map<string, string>();
    (branches ?? []).forEach((b) => map.set(b._id, b.name));
    return map;
  }, [branches]);

  const branchOptions = useMemo(
    () => [
      { label: "Semua Cabang", value: "" },
      ...(branches ?? []).map((b) => ({ label: b.name, value: b._id })),
    ],
    [branches],
  );

  const categoryOptions = useMemo(
    () =>
      (categories ?? []).map((c) => ({
        label:
          c.variantLabels.length > 0
            ? `${c.name} (${c.variantLabels.join(", ")})`
            : c.name,
        value: c._id,
      })),
    [categories],
  );

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    (categories ?? []).forEach((c) => map.set(c._id, c.name));
    return map;
  }, [categories]);

  // --- Modal Create/Edit Info Produk ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // --- Gambar produk (dipakai di modal Create maupun Edit) ---
  // Create: file dipilih dulu, di-upload SETELAH produk berhasil dibuat (butuh SKU utk objectKey).
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  // Edit: aksi galeri (hapus/jadiin cover) berdiri sendiri, gak nunggu submit form info.
  const [galleryActionUrl, setGalleryActionUrl] = useState<string | null>(null);
  const [galleryError, setGalleryError] = useState<string | null>(null);

  // --- Modal Mutasi Stok ---
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [stockBranchId, setStockBranchId] = useState("");
  const [stockVariantLabel, setStockVariantLabel] = useState("");
  const [stockQty, setStockQty] = useState("");
  const [stockError, setStockError] = useState<string | null>(null);
  const [isStockSubmitting, setIsStockSubmitting] = useState(false);

  const openCreateModal = () => {
    if (!guardMutation()) return;
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setNewImageFiles([]);
    setGalleryError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    if (!guardMutation()) return;
    setEditingProduct(product);
    setForm({
      name: product.name,
      sku: product.sku,
      description: product.description ?? "",
      price: String(product.price),
      categoryId: getCategoryId(product),
      branchId: "",
      initialQty: "",
    });
    setFormError(null);
    setNewImageFiles([]);
    setGalleryError(null);
    setIsModalOpen(true);
  };

  const openStockModal = (product: Product) => {
    if (!guardMutation()) return;
    setStockProduct(product);
    // Sengaja TIDAK di-default ke varian/cabang pertama — kalau user gak sadar ganti
    // pilihan, mutasi bisa nyasar ke varian yang salah (mis. selalu ke "S" tanpa disadari).
    // User wajib pilih sendiri Varian & Cabang tujuan sebelum submit.
    setStockBranchId("");
    setStockVariantLabel("");
    setStockQty("");
    setStockError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!guardMutation()) return;

    setFormError(null);
    setIsSubmitting(true);

    try {
      const price = Number(form.price);
      if (Number.isNaN(price) || price < 0) {
        throw new Error("Harga produk harus berupa angka positif, Bre!");
      }

      if (editingProduct) {
        await productsService.updateInfo(editingProduct._id, {
          name: form.name,
          price,
          description: form.description || undefined,
          categoryId: form.categoryId || undefined,
        });
        showToast({ variant: "success", title: "Info produk diperbarui" });
      } else {
        if (!form.categoryId) {
          throw new Error("Pilih kategori produk dulu, Bre!");
        }

        const initialQty = Number(form.initialQty);
        const hasInitialStock = form.branchId && form.initialQty !== "";

        if (hasInitialStock && (Number.isNaN(initialQty) || initialQty < 0)) {
          throw new Error("Jumlah stok awal harus berupa angka positif, Bre!");
        }

        const { uploadUrls } = await productsService.create({
          name: form.name,
          sku: form.sku,
          price,
          description: form.description || undefined,
          categoryId: form.categoryId,
          branchId: hasInitialStock ? form.branchId : undefined,
          initialQty: hasInitialStock ? initialQty : undefined,
          imageTypes:
            newImageFiles.length > 0
              ? newImageFiles.map((f) => f.type)
              : undefined,
        });

        showToast({ variant: "success", title: "Produk baru berhasil dibuat" });

        // Produk (+ record gambar & presigned URL) udah tersimpan di backend.
        // Upload file asli ke storage-nya dilakukan terpisah supaya kegagalan upload
        // gak bikin seluruh pembuatan produk gagal — cukup kasih tau lewat toast.
        if (newImageFiles.length > 0 && uploadUrls.length > 0) {
          try {
            setIsUploadingImages(true);
            await uploadImagesToPresignedUrls(newImageFiles, uploadUrls);
          } catch {
            showToast({
              variant: "error",
              title: "Produk tersimpan, tapi gambar gagal ke-upload",
              description:
                "Coba tambahkan lagi gambarnya lewat tombol Edit pada produk ini.",
            });
          } finally {
            setIsUploadingImages(false);
          }
        }
      }
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      setFormError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Tambah gambar baru ke produk yang SUDAH ada (dari dalam modal Edit). */
  const handleAddImagesToExisting = async (files: File[]) => {
    if (!guardMutation() || !editingProduct || files.length === 0) return;

    setGalleryError(null);
    setIsUploadingImages(true);
    try {
      const { data: updated, uploadUrls } = await productsService.addImages(
        editingProduct._id,
        files.map((f) => f.type),
      );
      await uploadImagesToPresignedUrls(files, uploadUrls);
      setEditingProduct(updated);
      showToast({ variant: "success", title: "Gambar berhasil ditambahkan" });
      refetch();
    } catch (err) {
      setGalleryError(extractErrorMessage(err));
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleRemoveImage = async (url: string) => {
    if (!guardMutation() || !editingProduct) return;

    setGalleryError(null);
    setGalleryActionUrl(url);
    try {
      const updated = await productsService.removeImage(
        editingProduct._id,
        url,
      );
      setEditingProduct(updated);
      showToast({ variant: "success", title: "Gambar berhasil dihapus" });
      refetch();
    } catch (err) {
      setGalleryError(extractErrorMessage(err));
    } finally {
      setGalleryActionUrl(null);
    }
  };

  const handleSetCoverImage = async (url: string) => {
    if (!guardMutation() || !editingProduct) return;

    setGalleryError(null);
    setGalleryActionUrl(url);
    try {
      const updated = await productsService.setCoverImage(
        editingProduct._id,
        url,
      );
      setEditingProduct(updated);
      showToast({ variant: "success", title: "Cover produk diperbarui" });
      refetch();
    } catch (err) {
      setGalleryError(extractErrorMessage(err));
    } finally {
      setGalleryActionUrl(null);
    }
  };

  const handleStockSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!guardMutation() || !stockProduct) return;

    setStockError(null);

    const qtyChange = Number(stockQty);
    if (Number.isNaN(qtyChange) || qtyChange === 0) {
      setStockError("Jumlah mutasi harus berupa angka bukan nol, Bre!");
      return;
    }
    if (!stockBranchId) {
      setStockError("Pilih cabang tujuan mutasi stok dulu.");
      return;
    }
    if (!stockVariantLabel) {
      setStockError("Pilih varian tujuan mutasi stok dulu.");
      return;
    }

    setIsStockSubmitting(true);
    try {
      await productsService.updateStock(
        stockProduct._id,
        stockBranchId,
        stockVariantLabel,
        qtyChange,
      );
      showToast({ variant: "success", title: "Mutasi stok berhasil" });
      setStockProduct(null);
      refetch();
    } catch (err) {
      setStockError(extractErrorMessage(err));
    } finally {
      setIsStockSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    try {
      await productsService.remove(deletingProduct._id);
      showToast({ variant: "success", title: "Produk berhasil dihapus" });
      refetch();
    } catch (err) {
      showToast({
        variant: "error",
        title: "Gagal menghapus produk",
        description: extractErrorMessage(err),
      });
    } finally {
      setDeletingProduct(null);
    }
  };

  const columns: TableColumn<Product>[] = [
    {
      key: "name",
      header: "Produk",
      render: (row) => {
        const coverUrl =
          row.images.find((img) => img.isCover)?.url ?? row.images[0]?.url;
        return (
          <div className="flex items-center gap-2.5">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt=""
                className="h-8 w-8 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-200 text-purple-800">
                <Package size={15} />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-medium">{row.name}</p>
              <p className="text-xs text-gray-700">{row.sku}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "category",
      header: "Kategori",
      hideOnMobile: true,
      render: (row) =>
        typeof row.categoryId === "string" ? (
          (categoryMap.get(row.categoryId) ?? "-")
        ) : (
          <Badge tone="purple">{row.categoryId.name}</Badge>
        ),
    },
    {
      key: "price",
      header: "Harga",
      render: (row) => formatRupiah(row.price),
    },
    {
      key: "stock",
      header: "Stok",
      hideOnMobile: true,
      render: (row) => {
        const totalQty = getTotalStock(row);
        const branchAllocations = getBranchAllocationCount(row);

        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">{totalQty} unit</span>
            <span className="text-xs text-gray-700">
              {row.variants.length} varian · {branchAllocations} alokasi cabang
            </span>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-1.5">
          {canAdjustStock && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Mutasi stok"
              onClick={() => openStockModal(row)}>
              <PackagePlus size={15} />
            </Button>
          )}
          {canManage && (
            <>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Edit produk"
                onClick={() => openEditModal(row)}>
                <Pencil size={15} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Hapus produk"
                onClick={() => {
                  if (!guardMutation()) return;
                  setDeletingProduct(row);
                }}>
                <Trash2 size={15} className="text-red-700" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-1000">Produk</h2>
          <p className="text-sm text-gray-700">
            Katalog produk dan stok per cabang.
          </p>
        </div>
        {canManage && (
          <Button leftIcon={<Plus size={16} />} onClick={openCreateModal}>
            Produk Baru
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Cari nama atau SKU..."
          leftIcon={<Search size={15} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select
          options={branchOptions}
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="sm:max-w-52"
          aria-label="Filter cabang"
        />
      </div>

      {error && (
        <Alert variant="error" title="Gagal memuat daftar produk">
          {error}
        </Alert>
      )}

      <Card>
        {!isLoading && !error && (products?.length ?? 0) === 0 ? (
          <EmptyState
            icon={Package}
            title="Belum ada produk"
            description="Tambahkan produk pertama ke katalog toko."
            action={
              canManage && (
                <Button leftIcon={<Plus size={16} />} onClick={openCreateModal}>
                  Produk Baru
                </Button>
              )
            }
          />
        ) : (
          <Table
            columns={columns}
            data={products ?? []}
            isLoading={isLoading}
            getRowKey={(row) => row._id}
          />
        )}
      </Card>

      {/* Modal Create/Edit Info */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (isSubmitting) return;
          setIsModalOpen(false);
        }}
        title={editingProduct ? "Edit Produk" : "Produk Baru"}
        footer={
          <>
            <Button
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setIsModalOpen(false)}>
              {editingProduct ? "Tutup" : "Batal"}
            </Button>
            <Button form="product-form" type="submit" isLoading={isSubmitting}>
              {editingProduct ? "Simpan Perubahan" : "Buat Produk"}
            </Button>
          </>
        }>
        <form
          id="product-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-4">
          {formError && (
            <Alert variant="error" title="Gagal menyimpan">
              {formError}
            </Alert>
          )}
          <Input
            label="Nama Produk"
            placeholder="Indomie Goreng"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="SKU"
            placeholder="IDM-GRG-001"
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            disabled={Boolean(editingProduct)}
            helperText={
              editingProduct
                ? "SKU tidak bisa diubah setelah dibuat."
                : undefined
            }
            required={!editingProduct}
          />
          <Select
            label="Kategori"
            options={categoryOptions}
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            placeholder={
              categoryOptions.length === 0
                ? "Belum ada kategori — buat kategori dulu"
                : "Pilih kategori"
            }
            disabled={categoryOptions.length === 0}
            helperText={
              !editingProduct
                ? "Varian produk ikut menyesuaikan varian kategori yang dipilih."
                : undefined
            }
            required
          />
          <Input
            label="Harga"
            type="number"
            min={0}
            placeholder="3500"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
          <Textarea
            label="Deskripsi (opsional)"
            placeholder="Deskripsi singkat produk..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          {/* --- Gambar Produk --- */}
          <div className="flex flex-col gap-3 rounded-lg border border-gray-alpha-400 p-3">
            <p className="text-xs font-medium text-gray-1000">
              Gambar Produk (opsional)
            </p>

            {galleryError && (
              <Alert variant="error" title="Gagal memproses gambar">
                {galleryError}
              </Alert>
            )}

            {editingProduct ? (
              <>
                {editingProduct.images.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {editingProduct.images.map((img) => {
                      const isBusy = galleryActionUrl === img.url;
                      return (
                        <div
                          key={img.url}
                          className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-alpha-400">
                          <img
                            src={img.url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                          {img.isCover && (
                            <span className="absolute left-1 top-1 rounded bg-blue-800 px-1 py-0.5 text-[10px] font-medium text-white">
                              Cover
                            </span>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center gap-1 bg-gray-alpha-700 opacity-0 transition-opacity group-hover:opacity-100">
                            {!img.isCover && (
                              <button
                                type="button"
                                aria-label="Jadikan cover"
                                disabled={isBusy}
                                onClick={() => handleSetCoverImage(img.url)}
                                className="rounded-full bg-white p-1.5 hover:bg-gray-100 disabled:opacity-50">
                                <Star size={13} className="text-amber-700" />
                              </button>
                            )}
                            <button
                              type="button"
                              aria-label="Hapus gambar"
                              disabled={isBusy}
                              onClick={() => handleRemoveImage(img.url)}
                              className="rounded-full bg-white p-1.5 hover:bg-gray-100 disabled:opacity-50">
                              <X size={13} className="text-red-700" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-700">
                    Produk ini belum punya gambar.
                  </p>
                )}

                <label className="flex w-fit cursor-pointer items-center gap-1.5 text-xs font-medium text-blue-800 hover:underline">
                  <ImagePlus size={14} />
                  {isUploadingImages ? "Mengupload..." : "Tambah Gambar"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={isUploadingImages}
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []).slice(
                        0,
                        MAX_IMAGES_PER_UPLOAD,
                      );
                      e.target.value = "";
                      if (files.length > 0) handleAddImagesToExisting(files);
                    }}
                  />
                </label>
              </>
            ) : (
              <>
                <p className="text-xs text-gray-700">
                  Gambar pertama otomatis jadi cover katalog. Bisa diatur ulang
                  lewat Edit setelah produk dibuat.
                </p>

                {newImageFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newImageFiles.map((file, idx) => (
                      <div
                        key={`${file.name}-${idx}`}
                        className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-alpha-400">
                        <img
                          src={URL.createObjectURL(file)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                        {idx === 0 && (
                          <span className="absolute left-1 top-1 rounded bg-blue-800 px-1 py-0.5 text-[10px] font-medium text-white">
                            Cover
                          </span>
                        )}
                        <button
                          type="button"
                          aria-label="Batalkan gambar ini"
                          onClick={() =>
                            setNewImageFiles((prev) =>
                              prev.filter((_, i) => i !== idx),
                            )
                          }
                          className="absolute inset-0 flex items-center justify-center bg-gray-alpha-700 opacity-0 transition-opacity group-hover:opacity-100">
                          <X size={16} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {newImageFiles.length < MAX_IMAGES_PER_UPLOAD && (
                  <label className="flex w-fit cursor-pointer items-center gap-1.5 text-xs font-medium text-blue-800 hover:underline">
                    <ImagePlus size={14} />
                    Pilih Gambar
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const picked = Array.from(e.target.files ?? []);
                        e.target.value = "";
                        setNewImageFiles((prev) =>
                          [...prev, ...picked].slice(0, MAX_IMAGES_PER_UPLOAD),
                        );
                      }}
                    />
                  </label>
                )}
              </>
            )}
          </div>

          {!editingProduct && (
            <div className="flex flex-col gap-3 rounded-lg border border-gray-alpha-400 p-3">
              <p className="text-xs font-medium text-gray-1000">
                Stok Awal (opsional)
              </p>
              <p className="text-xs text-gray-700">
                Kalau diisi, stok masuk ke varian pertama dari kategori
                terpilih. Alokasi ke varian/cabang lain bisa lewat mutasi stok
                setelah produk dibuat.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Select
                  label="Cabang"
                  options={branchOptions.filter((o) => o.value !== "")}
                  value={form.branchId}
                  onChange={(e) =>
                    setForm({ ...form, branchId: e.target.value })
                  }
                  placeholder="Pilih cabang"
                  className="sm:flex-1"
                />
                <Input
                  label="Jumlah"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.initialQty}
                  onChange={(e) =>
                    setForm({ ...form, initialQty: e.target.value })
                  }
                  className="sm:flex-1"
                />
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Modal Mutasi Stok */}
      <Modal
        isOpen={Boolean(stockProduct)}
        onClose={() => setStockProduct(null)}
        title={`Mutasi Stok — ${stockProduct?.name ?? ""}`}
        description="Kasir hanya boleh menambah stok, tidak boleh mengurangi."
        footer={
          <>
            <Button variant="outline" onClick={() => setStockProduct(null)}>
              Batal
            </Button>
            <Button
              form="stock-form"
              type="submit"
              isLoading={isStockSubmitting}>
              Simpan Mutasi
            </Button>
          </>
        }>
        <form
          id="stock-form"
          onSubmit={handleStockSubmit}
          className="flex flex-col gap-4">
          {stockError && (
            <Alert variant="error" title="Gagal mutasi stok">
              {stockError}
            </Alert>
          )}

          {stockProduct && stockProduct.variants.length > 0 && (
            <div className="flex flex-col gap-2">
              {stockProduct.variants.map((v) => {
                const isSelected = v.label === stockVariantLabel;
                return (
                  <div
                    key={v.label}
                    className={`flex flex-wrap items-center gap-1.5 rounded-md px-1.5 py-1 ${
                      isSelected ? "bg-blue-100 ring-1 ring-blue-400" : ""
                    }`}>
                    <Badge tone={isSelected ? "blue" : "gray"}>
                      {v.label === DEFAULT_VARIANT_LABEL ? "Standar" : v.label}
                    </Badge>
                    {v.stocks.length === 0 ? (
                      <span className="text-xs text-gray-700">
                        Belum ada alokasi stok
                      </span>
                    ) : (
                      v.stocks.map((s) => (
                        <Badge key={s.branchId} tone="gray">
                          {branchMap.get(s.branchId) ?? "Cabang"}: {s.qty} unit
                        </Badge>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <Select
            label="Varian"
            options={(stockProduct?.variants ?? []).map((v) => ({
              label: v.label === DEFAULT_VARIANT_LABEL ? "Standar" : v.label,
              value: v.label,
            }))}
            value={stockVariantLabel}
            onChange={(e) => setStockVariantLabel(e.target.value)}
            placeholder="Pilih varian"
            required
          />
          <Select
            label="Cabang Tujuan"
            options={branchOptions.filter((o) => o.value !== "")}
            value={stockBranchId}
            onChange={(e) => setStockBranchId(e.target.value)}
            placeholder="Pilih cabang"
            required
          />
          <Input
            label="Jumlah Mutasi"
            type="number"
            placeholder="Contoh: 10 (tambah) atau -5 (kurangi, khusus Owner/Dev)"
            value={stockQty}
            onChange={(e) => setStockQty(e.target.value)}
            helperText="Gunakan angka negatif untuk mengurangi stok (hanya Owner/Developer)."
            required
          />
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletingProduct)}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleDelete}
        title={`Hapus produk "${deletingProduct?.name}"?`}
        description="Aksi ini permanen dan akan dicatat di audit log."
      />
    </div>
  );
}
