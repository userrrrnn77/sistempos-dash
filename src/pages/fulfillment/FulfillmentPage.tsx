// src/pages/fulfillment/FulfillmentPage.tsx
import { useMemo, useState } from "react";
import { PackageCheck, Truck } from "lucide-react";
import { useFetch } from "../../hooks/useFetch";
import { transactionsService } from "../../services/transactions";
import { branchesService } from "../../services/branches";
import type { FulfillmentOrder } from "../../types/api";
import { Card } from "../../components/ui/Card";
import { Table, type TableColumn } from "../../components/ui/Table";
import { Select } from "../../components/ui/Select";
import { Badge } from "../../components/ui/Badge";
import { Alert } from "../../components/ui/Alert";
import { EmptyState } from "../../components/ui/EmptyState";

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const STATUS_OPTIONS = [
  { label: "Siap Diproses (Sudah Bayar)", value: "PAID" },
  { label: "Menunggu Pembayaran", value: "PENDING" },
  { label: "Gagal Bayar", value: "FAILED" },
];

export default function FulfillmentPage() {
  const { data: branches } = useFetch(() => branchesService.getAll(), []);
  const [branchId, setBranchId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("PAID");

  const effectiveBranchId = branchId || branches?.[0]?._id || "";

  const {
    data: orders,
    isLoading,
    error,
  } = useFetch(
    () =>
      effectiveBranchId
        ? transactionsService.getFulfillmentOrders({
            branchId: effectiveBranchId,
            paymentStatus,
          })
        : Promise.resolve([]),
    [effectiveBranchId, paymentStatus],
  );

  const branchOptions = useMemo(
    () => (branches ?? []).map((b) => ({ label: b.name, value: b._id })),
    [branches],
  );

  const getCustomerLabel = (order: FulfillmentOrder): string => {
    if (!order.customerId) return "Customer tidak dikenal";
    if (typeof order.customerId === "string") return order.customerId;
    return order.customerId.name;
  };

  const columns: TableColumn<FulfillmentOrder>[] = [
    {
      key: "invoiceNumber",
      header: "No. Invoice",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-200 text-teal-800">
            <Truck size={15} />
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
      key: "customer",
      header: "Customer",
      render: (row) => (
        <span className="text-gray-800">{getCustomerLabel(row)}</span>
      ),
    },
    {
      key: "items",
      header: "Item Cabang Ini",
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          {row.items.map((item, idx) => (
            <span key={idx} className="text-sm text-gray-800">
              {item.qty}x {item.name}
              {item.variantLabel !== "-" ? ` (${item.variantLabel})` : ""}
            </span>
          ))}
        </div>
      ),
      hideOnMobile: true,
    },
    {
      key: "isMultiBranchOrder",
      header: "Cabang",
      render: (row) =>
        row.isMultiBranchOrder ? (
          <Badge tone="amber">Multi-cabang</Badge>
        ) : (
          <Badge tone="gray">Satu cabang</Badge>
        ),
    },
    {
      key: "paymentMethod",
      header: "Pembayaran",
      render: (row) => (
        <Badge tone={row.paymentStatus === "PAID" ? "green" : "amber"}>
          {row.paymentMethod} · {row.paymentStatus}
        </Badge>
      ),
    },
    {
      key: "branchSubtotal",
      header: "Subtotal Cabang Ini",
      align: "right",
      render: (row) => (
        <span className="font-medium">{formatRupiah(row.branchSubtotal)}</span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-1000">
          Pesanan Online (Fulfillment)
        </h2>
        <p className="text-sm text-gray-700">
          Pesanan e-commerce yang perlu disiapkan/dikirim dari cabang ini. Kalau
          satu invoice berisi barang dari beberapa cabang, cuma item milik
          cabang ini yang ditampilkan.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Select
          label="Cabang"
          options={branchOptions}
          value={effectiveBranchId}
          onChange={(e) => setBranchId(e.target.value)}
          placeholder={
            branchOptions.length === 0 ? "Belum ada cabang" : undefined
          }
          className="sm:max-w-64"
        />
        <Select
          label="Status Pembayaran"
          options={STATUS_OPTIONS}
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value)}
          className="sm:max-w-64"
        />
      </div>

      {error && (
        <Alert variant="error" title="Gagal memuat pesanan fulfillment">
          {error}
        </Alert>
      )}

      <Card>
        {!isLoading && !error && (orders?.length ?? 0) === 0 ? (
          <EmptyState
            icon={PackageCheck}
            title="Belum ada pesanan untuk diproses"
            description="Semua pesanan online cabang ini dengan status terpilih sudah beres, atau memang belum ada masuk."
          />
        ) : (
          <Table
            columns={columns}
            data={orders ?? []}
            isLoading={isLoading}
            getRowKey={(row) => row._id}
          />
        )}
      </Card>
    </div>
  );
}
