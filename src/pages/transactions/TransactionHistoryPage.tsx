// src/pages/transactions/TransactionHistoryPage.tsx
import { useMemo, useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, Receipt, Search } from "lucide-react";
import { useFetch, extractErrorMessage } from "../../hooks/useFetch";
import { transactionsService } from "../../services/transactions";
import { branchesService } from "../../services/branches";
import type { Transaction } from "../../types/api";
import { Card, CardContent } from "../../components/ui/Card";
import { Table, type TableColumn } from "../../components/ui/Table";
import { Select } from "../../components/ui/Select";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { Modal } from "../../components/ui/Modal";
import { Spinner } from "../../components/ui/Spinner";

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resolveName(
  ref: Transaction["branchId"] | Transaction["cashierId"],
): string {
  if (!ref) return "-";
  if (typeof ref === "string") return ref;
  return "name" in ref ? ref.name : "-";
}

const PAYMENT_STATUS_TONE: Record<
  Transaction["paymentStatus"],
  "green" | "amber" | "red"
> = {
  PAID: "green",
  PENDING: "amber",
  FAILED: "red",
};

const STATUS_OPTIONS = [
  { label: "Semua Status", value: "" },
  { label: "Lunas", value: "PAID" },
  { label: "Menunggu", value: "PENDING" },
  { label: "Gagal", value: "FAILED" },
];

export default function TransactionHistoryPage() {
  // --- Filter tabel riwayat ---
  const [branchId, setBranchId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const { data: branches } = useFetch(() => branchesService.getAll(), []);

  const {
    data: listResult,
    isLoading: isListLoading,
    error: listError,
  } = useFetch(
    () =>
      transactionsService.getList({
        branchId: branchId || undefined,
        paymentStatus: paymentStatus || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        limit: 20,
      }),
    [branchId, paymentStatus, dateFrom, dateTo, page],
  );

  const transactions = listResult?.data ?? [];
  const pagination = listResult?.pagination;

  const branchOptions = useMemo(
    () => [
      { label: "Semua Cabang", value: "" },
      ...(branches ?? []).map((b) => ({ label: b.name, value: b._id })),
    ],
    [branches],
  );

  const resetToFirstPage = () => setPage(1);

  // --- Search cepat by ID nota ---
  const [billId, setBillId] = useState("");
  const [isSearchingById, setIsSearchingById] = useState(false);
  const [searchByIdError, setSearchByIdError] = useState<string | null>(null);

  const [searchResults, setSearchResults] = useState<Transaction[]>([]);

  // --- Modal detail nota (dibuka dari klik baris tabel ATAU hasil search by ID) ---
  const [detailTransaction, setDetailTransaction] =
    useState<Transaction | null>(null);

  const openDetail = (transaction: Transaction) => {
    setDetailTransaction(transaction);
  };

  const handleSearchById = async (e: FormEvent) => {
    e.preventDefault();
    if (!billId.trim()) return;

    setIsSearchingById(true);
    setSearchByIdError(null);
    setSearchResults([]);

    try {
      const results = await transactionsService.searchAuditBills(billId.trim());
      if (results.length === 1) {
        openDetail(results[0]);
      } else {
        setSearchResults(results);
      }
    } catch (err) {
      setSearchByIdError(extractErrorMessage(err));
    } finally {
      setIsSearchingById(false);
    }
  };

  const handlePickSearchResult = (transaction: Transaction) => {
    setSearchResults([]);
    openDetail(transaction);
  };

  const columns: TableColumn<Transaction>[] = [
    {
      key: "invoiceNumber",
      header: "No. Invoice",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-200 text-blue-800">
            <Receipt size={15} />
          </div>
          <div>
            <p className="font-medium">{row.invoiceNumber}</p>
            <p className="text-xs text-gray-700">
              {formatDateTime(row.createdAt)}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "source",
      header: "Sumber",
      render: (row) => (
        <Badge tone={row.source === "CASHIER" ? "gray" : "purple"}>
          {row.source}
        </Badge>
      ),
      hideOnMobile: true,
    },
    {
      key: "branch",
      header: "Cabang",
      render: (row) => resolveName(row.branchId),
      hideOnMobile: true,
    },
    {
      key: "cashier",
      header: "Kasir",
      render: (row) => resolveName(row.cashierId),
      hideOnMobile: true,
    },
    {
      key: "paymentMethod",
      header: "Bayar",
      render: (row) => (
        <Badge tone={PAYMENT_STATUS_TONE[row.paymentStatus]} dot>
          {row.paymentMethod} · {row.paymentStatus}
        </Badge>
      ),
    },
    {
      key: "totalAmount",
      header: "Total",
      align: "right",
      render: (row) => (
        <span className="font-medium">{formatRupiah(row.totalAmount)}</span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-1000">
            Riwayat Pesanan
          </h2>
          <p className="text-sm text-gray-700">
            Daftar seluruh transaksi kasir & e-commerce. Klik baris untuk lihat
            detail nota.
          </p>
        </div>
      </div>

      {/* --- Search cepat by ID, buat yang udah punya ID nota di tangan (mis. dari struk) --- */}
      <Card>
        <CardContent className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-medium text-gray-1000">
              Cari Cepat by ID Nota
            </p>
            <p className="text-xs text-gray-700">
              Masukin nomor invoice dari struk (mis. POS-BDDB-...) atau ID
              transaksi MongoDB.
            </p>
          </div>
          <form
            onSubmit={handleSearchById}
            className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="mis. POS-BDDB-1784535846147"
              leftIcon={<Search size={15} />}
              value={billId}
              onChange={(e) => setBillId(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" isLoading={isSearchingById}>
              Cari Nota
            </Button>
          </form>
          {searchByIdError && (
            <Alert variant="error" title="Nota tidak ditemukan">
              {searchByIdError}
            </Alert>
          )}
          {searchResults.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-gray-alpha-400 pt-3">
              <p className="text-xs text-gray-700">
                Ketemu {searchResults.length} nota dengan akhiran "
                {billId.trim()}", pilih salah satu:
              </p>
              {searchResults.map((tx) => (
                <button
                  key={tx._id}
                  type="button"
                  onClick={() => handlePickSearchResult(tx)}
                  className="flex items-center justify-between rounded-lg border border-gray-alpha-400 px-3 py-2 text-left text-sm hover:bg-gray-100">
                  <div>
                    <p className="font-medium">{tx.invoiceNumber}</p>
                    <p className="text-xs text-gray-700">
                      {formatDateTime(tx.createdAt)}
                    </p>
                  </div>
                  <span className="font-medium">
                    {formatRupiah(tx.totalAmount)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Select
          label="Cabang"
          options={branchOptions}
          value={branchId}
          onChange={(e) => {
            setBranchId(e.target.value);
            resetToFirstPage();
          }}
          className="sm:max-w-48"
        />
        <Select
          label="Status Bayar"
          options={STATUS_OPTIONS}
          value={paymentStatus}
          onChange={(e) => {
            setPaymentStatus(e.target.value);
            resetToFirstPage();
          }}
          className="sm:max-w-44"
        />
        <Input
          label="Dari Tanggal"
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            resetToFirstPage();
          }}
          className="sm:max-w-44"
        />
        <Input
          label="Sampai Tanggal"
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            resetToFirstPage();
          }}
          className="sm:max-w-44"
        />
      </div>

      {listError && (
        <Alert variant="error" title="Gagal memuat riwayat transaksi">
          {listError}
        </Alert>
      )}

      <Card>
        {!isListLoading && !listError && transactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Belum ada transaksi"
            description="Transaksi kasir & e-commerce yang cocok dengan filter akan muncul di sini."
          />
        ) : (
          <>
            <Table
              columns={columns}
              data={transactions}
              isLoading={isListLoading}
              getRowKey={(row) => row._id}
              onRowClick={openDetail}
            />
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-alpha-400 px-4 py-3">
                <p className="text-xs text-gray-700">
                  Halaman {pagination.page} dari {pagination.totalPages} (
                  {pagination.total} total transaksi)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<ChevronLeft size={14} />}
                    disabled={pagination.page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    Sebelumnya
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    rightIcon={<ChevronRight size={14} />}
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() =>
                      setPage((p) => Math.min(pagination.totalPages, p + 1))
                    }>
                    Berikutnya
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* --- Modal Detail Nota --- */}
      <Modal
        isOpen={Boolean(detailTransaction)}
        onClose={() => setDetailTransaction(null)}
        title={detailTransaction?.invoiceNumber}
        description={
          detailTransaction
            ? formatDateTime(detailTransaction.createdAt)
            : undefined
        }
        size="lg">
        {detailTransaction && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Badge
                tone={PAYMENT_STATUS_TONE[detailTransaction.paymentStatus]}
                dot>
                {detailTransaction.paymentStatus}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b border-gray-alpha-400 pb-4 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs text-gray-700">Sumber</p>
                <p className="font-medium">{detailTransaction.source}</p>
              </div>
              <div>
                <p className="text-xs text-gray-700">Cabang</p>
                <p className="font-medium">
                  {resolveName(detailTransaction.branchId)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-700">Kasir</p>
                <p className="font-medium">
                  {resolveName(detailTransaction.cashierId)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-700">Metode Bayar</p>
                <p className="font-medium">{detailTransaction.paymentMethod}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {detailTransaction.items.map((item, idx) => (
                <div
                  key={`${item.productId}-${idx}`}
                  className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-gray-1000">
                      {item.name}
                      {item.variantLabel !== "-"
                        ? ` (${item.variantLabel})`
                        : ""}
                    </p>
                    <p className="text-xs text-gray-700">
                      {item.qty} x {formatRupiah(item.price)}
                    </p>
                  </div>
                  <p className="font-medium">{formatRupiah(item.subTotal)}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-gray-alpha-400 pt-3">
              <p className="text-sm font-semibold text-gray-1000">Total</p>
              <p className="text-base font-semibold text-gray-1000">
                {formatRupiah(detailTransaction.totalAmount)}
              </p>
            </div>
          </div>
        )}
        {!detailTransaction && (
          <div className="flex justify-center py-8">
            <Spinner size={24} />
          </div>
        )}
      </Modal>
    </div>
  );
}
