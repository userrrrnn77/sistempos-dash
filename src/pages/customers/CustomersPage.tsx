// src/pages/customers/CustomersPage.tsx
import { useState, type FormEvent } from "react";
import { Search, ShieldAlert, ShieldCheck, UserSearch } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { extractErrorMessage } from "../../hooks/useFetch";
import { customersService } from "../../services/customers";
import type { Customer, CustomerStatus } from "../../types/api";
import { Card } from "../../components/ui/Card";
import { Table, type TableColumn } from "../../components/ui/Table";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Badge, type BadgeTone } from "../../components/ui/Badge";
import { Alert } from "../../components/ui/Alert";
import { EmptyState } from "../../components/ui/EmptyState";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";

const STATUS_TONE: Record<CustomerStatus, BadgeTone> = {
  active: "green",
  suspended: "amber",
  banned: "red",
};

const STATUS_LABEL: Record<CustomerStatus, string> = {
  active: "Aktif",
  suspended: "Suspended",
  banned: "Banned",
};

interface PendingStatusChange {
  customer: Customer;
  nextStatus: CustomerStatus;
}

export default function CustomersPage() {
  const { hasRole, guardMutation } = useAuth();
  const { showToast } = useToast();
  const canManageStatus = hasRole("OWNER", "DEVELOPER");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Customer[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [pendingChange, setPendingChange] =
    useState<PendingStatusChange | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      const data = await customersService.search(trimmed);
      setResults(data);
    } catch (err) {
      setSearchError(extractErrorMessage(err));
      setResults(null);
    } finally {
      setIsSearching(false);
    }
  };

  const requestStatusChange = (
    customer: Customer,
    nextStatus: CustomerStatus,
  ) => {
    if (!guardMutation()) return;
    setPendingChange({ customer, nextStatus });
  };

  const confirmStatusChange = async () => {
    if (!pendingChange) return;
    const { customer, nextStatus } = pendingChange;

    setIsUpdating(true);
    try {
      const updated = await customersService.updateStatus(
        customer._id,
        nextStatus,
      );
      setResults(
        (prev) =>
          prev?.map((c) => (c._id === updated._id ? updated : c)) ?? prev,
      );
      showToast({
        variant: "success",
        title: `Status customer diubah jadi ${STATUS_LABEL[nextStatus]}`,
      });
    } catch (err) {
      showToast({
        variant: "error",
        title: "Gagal mengubah status customer",
        description: extractErrorMessage(err),
      });
    } finally {
      setIsUpdating(false);
      setPendingChange(null);
    }
  };

  const columns: TableColumn<Customer>[] = [
    {
      key: "name",
      header: "Nama",
      render: (row) => (
        <div>
          <p className="font-medium text-gray-1000">{row.name}</p>
          <p className="text-xs text-gray-700">{row.email}</p>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Telepon",
      render: (row) => (
        <span className="text-gray-800">{row.phone ?? "-"}</span>
      ),
      hideOnMobile: true,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge tone={STATUS_TONE[row.status ?? "active"]} dot>
          {STATUS_LABEL[row.status ?? "active"]}
        </Badge>
      ),
    },
    ...(canManageStatus
      ? [
          {
            key: "actions",
            header: "",
            align: "right" as const,
            render: (row: Customer) => {
              const status = row.status ?? "active";
              return (
                <div className="flex justify-end gap-1.5">
                  {status !== "active" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => requestStatusChange(row, "active")}>
                      <ShieldCheck size={15} className="text-green-700" />
                      Aktifkan
                    </Button>
                  )}
                  {status !== "suspended" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => requestStatusChange(row, "suspended")}>
                      <ShieldAlert size={15} className="text-amber-700" />
                      Suspend
                    </Button>
                  )}
                  {status !== "banned" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => requestStatusChange(row, "banned")}>
                      <ShieldAlert size={15} className="text-red-700" />
                      Banned
                    </Button>
                  )}
                </div>
              );
            },
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-1000">
          Customer Publik
        </h2>
        <p className="text-sm text-gray-700">
          Cari member/customer untuk cek data, atau kelola status kalau ada
          indikasi fraud/spam.
        </p>
      </div>

      <Card className="p-4">
        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Cari nama, email, atau nomor telepon..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <Button
            type="submit"
            leftIcon={<Search size={16} />}
            isLoading={isSearching}>
            Cari
          </Button>
        </form>
      </Card>

      {searchError && (
        <Alert variant="error" title="Gagal mencari customer">
          {searchError}
        </Alert>
      )}

      {hasSearched && !searchError && (
        <Card>
          {!isSearching && (results?.length ?? 0) === 0 ? (
            <EmptyState
              icon={UserSearch}
              title="Tidak ada customer ditemukan"
              description="Coba kata kunci lain — nama, email, atau nomor telepon."
            />
          ) : (
            <Table
              columns={columns}
              data={results ?? []}
              isLoading={isSearching}
              getRowKey={(row) => row._id}
            />
          )}
        </Card>
      )}

      <ConfirmDialog
        isOpen={Boolean(pendingChange)}
        onClose={() => setPendingChange(null)}
        onConfirm={confirmStatusChange}
        variant={
          pendingChange?.nextStatus === "active" ? "primary" : "destructive"
        }
        title={
          pendingChange
            ? `Ubah status "${pendingChange.customer.name}" jadi ${STATUS_LABEL[pendingChange.nextStatus]}?`
            : ""
        }
        description={
          pendingChange?.nextStatus === "banned" ||
          pendingChange?.nextStatus === "suspended"
            ? "Aksi ini akan dicatat di audit log dan bisa membatasi customer belanja online."
            : "Customer akan bisa belanja online seperti biasa lagi."
        }
        confirmLabel={isUpdating ? "Menyimpan..." : "Ya, Ubah Status"}
      />
    </div>
  );
}
