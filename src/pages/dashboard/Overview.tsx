// src/pages/dashboard/Overview.tsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Banknote,
  CreditCard,
  QrCode,
  Receipt,
  ShoppingCart,
  Store,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useFetch } from "../../hooks/useFetch";
import { transactionsService } from "../../services/transactions";
import { branchesService } from "../../services/branches";
import { StatCard } from "../../components/ui/StatCard";
import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { Select } from "../../components/ui/Select";
import { Chart } from "../../components/ui/Chart";
import { PageSpinner } from "../../components/ui/Spinner";
import { Alert } from "../../components/ui/Alert";
import { RoleBadge } from "../../components/RoleBadge";

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function Overview() {
  const { user, hasRole } = useAuth();
  const canSeeIncome = hasRole("OWNER", "DEVELOPER");
  const [branchId, setBranchId] = useState<string>("");

  const { data: branches } = useFetch(() => branchesService.getAll(), []);

  const {
    data: income,
    isLoading: isIncomeLoading,
    error: incomeError,
  } = useFetch(
    () =>
      canSeeIncome
        ? transactionsService.getDailyIncome(
            branchId ? { branchId } : undefined,
          )
        : Promise.resolve(null),
    [branchId, canSeeIncome],
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
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-1000">
            Halo, {user?.name ?? "Bre"}! 👋
          </h2>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-sm text-gray-700">Ini ringkasan hari ini.</p>
            {user?.role && <RoleBadge role={user.role} />}
          </div>
        </div>

        {canSeeIncome && (
          <div className="w-full sm:w-52">
            <Select
              options={branchOptions}
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              aria-label="Filter cabang"
            />
          </div>
        )}
      </div>

      {!canSeeIncome && (
        <Alert variant="info" title="Akses terbatas">
          Ringkasan omset harian hanya bisa dilihat oleh Owner dan Developer.
          Gunakan menu <strong>Kasir / POS</strong> untuk mulai transaksi.
        </Alert>
      )}

      {canSeeIncome && incomeError && (
        <Alert variant="error" title="Gagal memuat data omset">
          {incomeError}
        </Alert>
      )}

      {canSeeIncome && isIncomeLoading && <PageSpinner />}

      {canSeeIncome && !isIncomeLoading && income && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Omset Hari Ini"
              value={formatRupiah(income.summary.totalIncome)}
              icon={Receipt}
            />
            <StatCard
              label="Total Transaksi"
              value={String(income.totalTransactions)}
              icon={ShoppingCart}
            />
            <StatCard
              label="Tunai"
              value={formatRupiah(income.summary.cashAmount)}
              icon={Banknote}
            />
            <StatCard
              label="QRIS + Debit"
              value={formatRupiah(
                income.summary.qrisAmount + income.summary.debitAmount,
              )}
              icon={CreditCard}
            />
          </div>

          <Card>
            <CardHeader
              title="Komposisi Metode Pembayaran"
              description={`Tanggal ${income.date}`}
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
        </>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <QuickLinkCard
          icon={ShoppingCart}
          title="Buka Kasir"
          description="Mulai transaksi POS baru"
          href="/dashboard/pos"
        />
        <QuickLinkCard
          icon={Store}
          title="Cabang"
          description={`${branches?.length ?? 0} cabang terdaftar`}
          href="/dashboard/branches"
        />
        <QuickLinkCard
          icon={QrCode}
          title="Produk"
          description="Kelola katalog & stok"
          href="/dashboard/products"
        />
      </div>
    </div>
  );
}

function QuickLinkCard({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: typeof ShoppingCart;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      to={href}
      className="flex items-center gap-3 rounded-xl border border-gray-alpha-400 bg-background-100 p-4 shadow-raised transition-colors hover:bg-gray-100">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-200 text-blue-800">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-1000">{title}</p>
        <p className="truncate text-xs text-gray-700">{description}</p>
      </div>
    </Link>
  );
}
