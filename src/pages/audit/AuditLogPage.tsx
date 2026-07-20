// src/pages/audit/AuditLogPage.tsx
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import { useFetch } from "../../hooks/useFetch";
import { auditLogService } from "../../services/auditLog";
import type { AuditLog } from "../../types/api";
import { Card } from "../../components/ui/Card";
import { Alert } from "../../components/ui/Alert";
import { EmptyState } from "../../components/ui/EmptyState";
import { Table, type TableColumn } from "../../components/ui/Table";
import { Select } from "../../components/ui/Select";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { RoleBadge } from "../../components/RoleBadge";
import type { InternalRole } from "../../types/auth";

const ACTOR_ROLE_OPTIONS = [
  { label: "Semua Role", value: "" },
  { label: "Developer", value: "DEVELOPER" },
  { label: "Owner", value: "OWNER" },
  { label: "Cashier", value: "CASHIER" },
];

const TARGET_COLLECTION_OPTIONS = [
  { label: "Semua Koleksi", value: "" },
  { label: "Branch", value: "Branch" },
  { label: "Product", value: "Product" },
  { label: "UserInternal", value: "UserInternal" },
  { label: "UserExternal", value: "UserExternal" },
];

const ACTION_TONE: Record<string, "red" | "amber" | "blue" | "gray"> = {
  DELETE_BRANCH: "red",
  DELETE_PRODUCT: "red",
  DELETE_EMPLOYEE: "red",
  UPDATE_CUSTOMER_STATUS: "amber",
};

function resolveActorName(actorId: AuditLog["actorId"]): string {
  if (!actorId) return "-";
  if (typeof actorId === "string") return actorId;
  return actorId.name ?? actorId.email ?? "-";
}

export default function AuditLogPage() {
  const [actorRole, setActorRole] = useState("");
  const [targetCollection, setTargetCollection] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useFetch(
    () =>
      auditLogService.getAll({
        actorRole: actorRole ? (actorRole as InternalRole) : undefined,
        targetCollection: targetCollection || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        limit: 25,
      }),
    [actorRole, targetCollection, dateFrom, dateTo, page],
  );

  const logs = useMemo(() => data?.data ?? [], [data]);
  const pagination = data?.pagination;

  const resetToFirstPage = () => setPage(1);

  const columns: TableColumn<AuditLog>[] = [
    {
      key: "createdAt",
      header: "Waktu",
      render: (row) =>
        new Date(row.createdAt).toLocaleString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      width: "180px",
    },
    {
      key: "action",
      header: "Aksi",
      render: (row) => (
        <Badge tone={ACTION_TONE[row.action] ?? "gray"}>{row.action}</Badge>
      ),
    },
    {
      key: "actor",
      header: "Pelaku",
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <p className="font-medium text-gray-1000">
            {resolveActorName(row.actorId)}
          </p>
          <RoleBadge role={row.actorRole} />
        </div>
      ),
    },
    {
      key: "targetCollection",
      header: "Koleksi",
      render: (row) => row.targetCollection,
      hideOnMobile: true,
    },
    {
      key: "description",
      header: "Deskripsi",
      render: (row) => (
        <p className="max-w-md text-gray-900">{row.description}</p>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-1000">Audit Log</h2>
        <p className="text-sm text-gray-700">
          Riwayat aksi sensitif (hapus data, suspend akun, dsb) di seluruh
          sistem.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Select
          label="Role Pelaku"
          options={ACTOR_ROLE_OPTIONS}
          value={actorRole}
          onChange={(e) => {
            setActorRole(e.target.value);
            resetToFirstPage();
          }}
          className="sm:max-w-48"
        />
        <Select
          label="Koleksi Target"
          options={TARGET_COLLECTION_OPTIONS}
          value={targetCollection}
          onChange={(e) => {
            setTargetCollection(e.target.value);
            resetToFirstPage();
          }}
          className="sm:max-w-48"
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

      {error && (
        <Alert variant="error" title="Gagal memuat audit log">
          {error}
        </Alert>
      )}

      <Card>
        {!isLoading && !error && logs.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Belum ada audit log"
            description="Riwayat aksi sensitif akan muncul di sini begitu ada aktivitas."
          />
        ) : (
          <>
            <Table
              columns={columns}
              data={logs}
              isLoading={isLoading}
              getRowKey={(row) => row._id}
            />
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-alpha-400 px-4 py-3">
                <p className="text-xs text-gray-700">
                  Halaman {pagination.page} dari {pagination.totalPages} (
                  {pagination.total} total log)
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
    </div>
  );
}
