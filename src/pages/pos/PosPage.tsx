// src/pages/pos/PosPage.tsx
import { useMemo, useState } from "react";
import {
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useFetch, extractErrorMessage } from "../../hooks/useFetch";
import { productsService } from "../../services/products";
import { branchesService } from "../../services/branches";
import { customersService } from "../../services/customers";
import { transactionsService } from "../../services/transactions";
import type { Customer, PaymentMethod, Product } from "../../types/api";
import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Alert } from "../../components/ui/Alert";
import { EmptyState } from "../../components/ui/EmptyState";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Ambil URL gambar cover produk buat card katalog. Fallback ke gambar pertama
 * kalau belum ada yang di-set sebagai cover, atau undefined kalau produk belum
 * punya gambar sama sekali. */
function getCoverImageUrl(product: Product): string | undefined {
  return (
    product.images.find((img) => img.isCover)?.url ?? product.images[0]?.url
  );
}

interface CartLine {
  product: Product;
  variantLabel: string;
  qty: number;
}

const PAYMENT_OPTIONS: { label: string; value: PaymentMethod }[] = [
  { label: "Tunai", value: "CASH" },
  { label: "QRIS", value: "QRIS" },
  { label: "Debit", value: "DEBIT" },
];

export default function PosPage() {
  const { guardMutation, user, role } = useAuth();
  const { showToast } = useToast();

  const isCashier = role === "CASHIER";

  const { data: branches } = useFetch(() => branchesService.getAll(), []);
  const [branchId, setBranchId] = useState("");

  // Kasir WAJIB terkunci ke cabang tempat dia ditugaskan — gak boleh pilih
  // bebas, karena backend sekarang menolak/abaikan branchId lain dari kasir.
  // OWNER/DEVELOPER tetap bebas pilih cabang manapun buat nge-bantu jualan.
  const effectiveBranchId = isCashier
    ? user?.branchId || ""
    : branchId || branches?.[0]?._id || "";

  const [search, setSearch] = useState("");
  const {
    data: products,
    isLoading: isProductsLoading,
    error: productsError,
  } = useFetch(
    () =>
      effectiveBranchId
        ? productsService.getAll({
            branchId: effectiveBranchId,
            search: search || undefined,
          })
        : Promise.resolve([]),
    [effectiveBranchId, search],
  );

  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");

  // Produk yang lagi minta dipilih variannya sebelum masuk keranjang (null = modal tertutup)
  const [variantPickerProduct, setVariantPickerProduct] =
    useState<Product | null>(null);

  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /** Stok total produk ini (semua varian dijumlah) di cabang aktif — buat nampilin badge di grid katalog. */
  const totalStockForBranch = (product: Product): number =>
    product.variants.reduce(
      (sum, v) =>
        sum +
        (v.stocks.find((s) => s.branchId === effectiveBranchId)?.qty ?? 0),
      0,
    );

  const addToCart = (product: Product, variantLabel: string) => {
    setCart((prev) => {
      const existing = prev.find(
        (line) =>
          line.product._id === product._id &&
          line.variantLabel === variantLabel,
      );
      if (existing) {
        return prev.map((line) =>
          line.product._id === product._id && line.variantLabel === variantLabel
            ? { ...line, qty: line.qty + 1 }
            : line,
        );
      }
      return [...prev, { product, variantLabel, qty: 1 }];
    });
  };

  const handleProductClick = (product: Product) => {
    // Produk dari kategori tanpa varian cuma punya 1 varian default berlabel "-",
    // jadi bisa langsung masuk keranjang tanpa nanya-nanya dulu.
    if (product.variants.length <= 1) {
      addToCart(product, product.variants[0]?.label ?? "-");
      return;
    }
    // Punya beberapa varian (mis. size baju) — minta pilih dulu lewat modal.
    setVariantPickerProduct(product);
  };

  const changeQty = (
    productId: string,
    variantLabel: string,
    delta: number,
  ) => {
    setCart((prev) =>
      prev
        .map((line) =>
          line.product._id === productId && line.variantLabel === variantLabel
            ? { ...line, qty: line.qty + delta }
            : line,
        )
        .filter((line) => line.qty > 0),
    );
  };

  const removeFromCart = (productId: string, variantLabel: string) => {
    setCart((prev) =>
      prev.filter(
        (line) =>
          !(
            line.product._id === productId && line.variantLabel === variantLabel
          ),
      ),
    );
  };

  const total = useMemo(
    () => cart.reduce((sum, line) => sum + line.product.price * line.qty, 0),
    [cart],
  );

  const handleCustomerSearch = async () => {
    if (!customerQuery.trim()) return;
    setIsSearchingCustomer(true);
    try {
      const results = await customersService.search(customerQuery.trim());
      setCustomerResults(results);
    } catch (err) {
      showToast({
        variant: "error",
        title: "Gagal mencari member",
        description: extractErrorMessage(err),
      });
    } finally {
      setIsSearchingCustomer(false);
    }
  };

  const handleCheckout = async () => {
    if (!guardMutation()) return;
    if (cart.length === 0 || !effectiveBranchId) return;

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const bill = await transactionsService.createBill({
        branchId: effectiveBranchId,
        customerId: selectedCustomer?._id,
        items: cart.map((line) => ({
          productId: line.product._id,
          variantLabel: line.variantLabel,
          qty: line.qty,
        })),
        paymentMethod,
      });

      showToast({
        variant: "success",
        title: "Nota berhasil dicetak!",
        description: bill.invoiceNumber,
      });

      setCart([]);
      setSelectedCustomer(null);
      setCustomerQuery("");
      setCustomerResults([]);
    } catch (err) {
      setSubmitError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const branchOptions = (branches ?? []).map((b) => ({
    label: b.name,
    value: b._id,
  }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* --- Kolom Kiri: Pilih Cabang + Produk --- */}
      <div className="flex flex-col gap-4 lg:col-span-2">
        <div className="flex flex-col gap-3 sm:flex-row">
          {isCashier ? (
            // Kasir terkunci ke cabang tugasnya sendiri — bukan dropdown pilihan
            // bebas, biar gak ada kesan bisa cetak nota / potong stok cabang lain.
            <div className="flex items-center gap-2 rounded-lg border border-gray-alpha-400 px-3 py-2 text-sm sm:max-w-56">
              <span className="text-gray-700">Cabang:</span>
              <span className="font-medium text-gray-1000">
                {branches?.find((b) => b._id === effectiveBranchId)?.name ??
                  "Belum ditugaskan"}
              </span>
            </div>
          ) : (
            <Select
              options={
                branchOptions.length > 0
                  ? branchOptions
                  : [{ label: "Belum ada cabang", value: "" }]
              }
              value={effectiveBranchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="sm:max-w-56"
              aria-label="Pilih cabang"
            />
          )}
          <Input
            placeholder="Cari produk..."
            leftIcon={<Search size={15} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
        </div>

        {productsError && (
          <Alert variant="error" title="Gagal memuat produk">
            {productsError}
          </Alert>
        )}

        {!isProductsLoading && (products?.length ?? 0) === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Tidak ada produk"
            description="Coba ganti cabang atau kata kunci pencarian."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(products ?? []).map((product) => {
              const stock = totalStockForBranch(product);
              const coverUrl = getCoverImageUrl(product);
              return (
                <button
                  key={product._id}
                  type="button"
                  disabled={stock <= 0}
                  onClick={() => handleProductClick(product)}
                  className="flex flex-col items-start gap-1 rounded-xl border border-gray-alpha-400 bg-background-100 p-3 text-left shadow-raised transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={product.name}
                      className="aspect-square w-full rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                      <ShoppingCart size={20} />
                    </div>
                  )}
                  <p className="line-clamp-2 text-sm font-medium text-gray-1000">
                    {product.name}
                  </p>
                  <p className="text-sm font-semibold text-blue-800">
                    {formatRupiah(product.price)}
                  </p>
                  <Badge tone={stock > 0 ? "green" : "red"}>
                    Stok: {stock}
                  </Badge>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* --- Kolom Kanan: Cart + Checkout --- */}
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader title="Keranjang" description={`${cart.length} item`} />
          <CardContent>
            {cart.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-700">
                Belum ada item, klik produk di sebelah kiri untuk menambah.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {cart.map((line) => (
                  <div
                    key={`${line.product._id}-${line.variantLabel}`}
                    className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-1000">
                        {line.product.name}
                        {line.variantLabel !== "-" && (
                          <span className="ml-1.5 text-xs font-normal text-gray-700">
                            ({line.variantLabel})
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-700">
                        {formatRupiah(line.product.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Kurangi"
                        onClick={() =>
                          changeQty(line.product._id, line.variantLabel, -1)
                        }>
                        <Minus size={13} />
                      </Button>
                      <span className="w-6 text-center text-sm font-medium">
                        {line.qty}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Tambah"
                        onClick={() =>
                          changeQty(line.product._id, line.variantLabel, 1)
                        }>
                        <Plus size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Hapus dari keranjang"
                        onClick={() =>
                          removeFromCart(line.product._id, line.variantLabel)
                        }>
                        <Trash2 size={14} className="text-red-700" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Member (opsional)"
            description="Cari untuk diskon atau tracking pembelian"
          />
          <CardContent>
            {selectedCustomer ? (
              <div className="flex items-center justify-between gap-2 rounded-lg bg-green-100 px-3 py-2">
                <div className="flex items-center gap-2">
                  <UserCheck size={16} className="text-green-800" />
                  <div>
                    <p className="text-sm font-medium text-gray-1000">
                      {selectedCustomer.name}
                    </p>
                    <p className="text-xs text-gray-700">
                      {selectedCustomer.email}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Batalkan pilihan member"
                  onClick={() => setSelectedCustomer(null)}>
                  <UserX size={15} />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nama, email, atau HP..."
                    value={customerQuery}
                    onChange={(e) => setCustomerQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCustomerSearch();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    isLoading={isSearchingCustomer}
                    onClick={handleCustomerSearch}>
                    Cari
                  </Button>
                </div>
                {customerResults.length > 0 && (
                  <div className="flex flex-col gap-1 rounded-lg border border-gray-alpha-400 p-1.5">
                    {customerResults.map((c) => (
                      <button
                        key={c._id}
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(c);
                          setCustomerResults([]);
                        }}
                        className="rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-gray-100">
                        <p className="font-medium text-gray-1000">{c.name}</p>
                        <p className="text-xs text-gray-700">{c.email}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            {submitError && (
              <Alert
                variant="error"
                title="Gagal memproses transaksi"
                className="mb-3">
                {submitError}
              </Alert>
            )}

            <Select
              label="Metode Pembayaran"
              options={PAYMENT_OPTIONS}
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value as PaymentMethod)
              }
              className="mb-4"
            />

            <div className="mb-4 flex items-center justify-between border-t border-gray-alpha-400 pt-3">
              <p className="text-sm font-semibold text-gray-1000">Total</p>
              <p className="text-lg font-semibold text-gray-1000">
                {formatRupiah(total)}
              </p>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={cart.length === 0 || !effectiveBranchId}
              isLoading={isSubmitting}
              onClick={handleCheckout}>
              Cetak Nota
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* --- Modal Pilih Varian (muncul kalau produk yang diklik punya >1 varian) --- */}
      <Modal
        isOpen={variantPickerProduct !== null}
        onClose={() => setVariantPickerProduct(null)}
        title={variantPickerProduct?.name}
        description="Pilih varian yang mau ditambahkan ke keranjang"
        size="sm">
        <div className="flex flex-col gap-2">
          {variantPickerProduct?.variants.map((variant) => {
            const stock =
              variant.stocks.find((s) => s.branchId === effectiveBranchId)
                ?.qty ?? 0;
            return (
              <button
                key={variant.label}
                type="button"
                disabled={stock <= 0}
                onClick={() => {
                  addToCart(variantPickerProduct, variant.label);
                  setVariantPickerProduct(null);
                }}
                className="flex items-center justify-between rounded-lg border border-gray-alpha-400 px-3 py-2 text-left transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50">
                <span className="text-sm font-medium text-gray-1000">
                  {variant.label}
                </span>
                <Badge tone={stock > 0 ? "green" : "red"}>Stok: {stock}</Badge>
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
