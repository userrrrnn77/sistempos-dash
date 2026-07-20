// src/pages/transactions/DailyAuditPage.tsx
import { useMemo, useState } from "react";
import { Banknote, CreditCard, QrCode, Receipt } from "lucide-react";
import { useFetch } from "../../hooks/useFetch";
import { transactionsService } from "../../services/transactions";
import { branchesService } from "../../services/branches";
import { StatCard } from "../../components/ui/StatCard";
import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { Select } from "../../components/ui/Select";
import { Input } from "../../components/ui/Input";
import { Chart } from "../../components/ui/Chart";
import { PageSpinner } from "../../components/ui/Spinner";
import { Alert } from "../../components/ui/Alert";

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function todayIsoDate(): string {
  return new Date().toISOString().split("T")[0];
}

export default function DailyAuditPage() {
  const [branchId, setBranchId] = useState("");
  const [date, setDate] = useState(todayIsoDate());

  const { data: branches } = useFetch(() => branchesService.getAll(), []);

  const {
    data: income,
    isLoading,
    error,
  } = useFetch(
    () =>
      transactionsService.getDailyIncome({
        branchId: branchId || undefined,
        date,
      }),
    [branchId, date],
  );

  const branchOptions = useMemo(
    () => [
      { label: "Semua Cabang", value: "" },
      ...(branches ?? []).map((b) => ({ label: b.name, value: b._id })),
    ],
    [branches],
  );

  const chartData = useMemo(() => {
    if (!income) return [];
    return [
      { method: "Tunai", total: income.summary.cashAmount },
      { method: "QRIS", total: income.summary.qrisAmount },
      { method: "Debit", total: income.summary.debitAmount },
    ];
  }, [income]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-1000">Audit Harian</h2>
        <p className="text-sm text-gray-700">
          Rangkuman omset harian per cabang untuk kebutuhan audit.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Select
          label="Cabang"
          options={branchOptions}
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
          className="sm:max-w-52"
        />
        <Input
          label="Tanggal"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="sm:max-w-52"
        />
      </div>

      {error && (
        <Alert variant="error" title="Gagal memuat laporan audit">
          {error}
        </Alert>
      )}

      {isLoading && <PageSpinner />}

      {!isLoading && income && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Omset"
              value={formatRupiah(income.summary.totalIncome)}
              icon={Receipt}
            />
            <StatCard
              label="Total Transaksi"
              value={String(income.totalTransactions)}
            />
            <StatCard
              label="Tunai"
              value={formatRupiah(income.summary.cashAmount)}
              icon={Banknote}
            />
            <StatCard
              label="QRIS"
              value={formatRupiah(income.summary.qrisAmount)}
              icon={QrCode}
            />
          </div>

          <Card>
            <CardHeader
              title="Rincian Metode Pembayaran"
              description={`Tanggal ${income.date} — ${
                branchOptions.find((b) => b.value === branchId)?.label ??
                "Semua Cabang"
              }`}
            />
            <CardContent>
              <Chart
                type="bar"
                data={chartData}
                xKey="method"
                series={[{ dataKey: "total", label: "Total (Rp)" }]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Debit"
              description={formatRupiah(income.summary.debitAmount)}
              action={<CreditCard size={18} className="text-gray-700" />}
            />
          </Card>
        </>
      )}
    </div>
  );
}
