// src/pages/employees/EmployeeList.tsx
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useFetch, extractErrorMessage } from "../../hooks/useFetch";
import { employeesService } from "../../services/employees";
import { branchesService } from "../../services/branches";
import type { Employee } from "../../types/api";
import type { InternalRole, UserStatus } from "../../types/auth";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Table, type TableColumn } from "../../components/ui/Table";
import { Badge } from "../../components/ui/Badge";
import { Select } from "../../components/ui/Select";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Alert } from "../../components/ui/Alert";
import { EmptyState } from "../../components/ui/EmptyState";
import { RoleBadge } from "../../components/RoleBadge";
import { useToast } from "../../components/ui/Toast";

const ROLE_FILTER_OPTIONS = [
  { label: "Semua Role", value: "" },
  { label: "Owner", value: "OWNER" },
  { label: "Cashier", value: "CASHIER" },
];

const STATUS_TONE: Record<UserStatus, "green" | "gray" | "red"> = {
  active: "green",
  inactive: "gray",
  suspended: "red",
};

const CREATABLE_ROLES: { label: string; value: InternalRole }[] = [
  { label: "Owner", value: "OWNER" },
  { label: "Cashier", value: "CASHIER" },
];

interface CreateFormState {
  name: string;
  email: string;
  /** Password akun buat login ke portal internal. Minimal 8 karakter. */
  password: string;
  role: InternalRole;
  /** Wajib diisi kalau role === "CASHIER" — kasir selalu ditugaskan ke satu cabang. */
  branchId: string;
}

const EMPTY_FORM: CreateFormState = {
  name: "",
  email: "",
  password: "",
  role: "CASHIER",
  branchId: "",
};

export default function EmployeeList() {
  const navigate = useNavigate();
  const { hasRole, guardMutation } = useAuth();
  const { showToast } = useToast();
  const canManage = hasRole("OWNER", "DEVELOPER");

  const [roleFilter, setRoleFilter] = useState("");

  const { data: branches } = useFetch(() => branchesService.getAll(), []);

  const {
    data: employees,
    isLoading,
    error,
    refetch,
  } = useFetch(
    () =>
      employeesService.getAll(
        roleFilter ? { role: roleFilter as InternalRole } : undefined,
      ),
    [roleFilter],
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<CreateFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreateModal = () => {
    if (!guardMutation()) return;
    setForm(EMPTY_FORM);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!guardMutation()) return;

    if (form.role === "CASHIER" && !form.branchId) {
      setFormError("Kasir wajib ditugaskan ke satu cabang, Bre!");
      return;
    }

    if (form.password.length < 8) {
      setFormError("Password wajib diisi, minimal 8 karakter!");
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      await employeesService.create({
        ...form,
        branchId: form.role === "CASHIER" ? form.branchId : undefined,
      });
      showToast({
        variant: "success",
        title: "Karyawan baru berhasil ditambahkan",
      });
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      setFormError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: TableColumn<Employee>[] = [
    {
      key: "name",
      header: "Nama",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-900">
            {row.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-medium">{row.name}</p>
            <p className="truncate text-xs text-gray-700">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (row) => <RoleBadge role={row.role} />,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge tone={STATUS_TONE[row.status]} dot>
          {row.status}
        </Badge>
      ),
      hideOnMobile: true,
    },
    {
      key: "joinedAt",
      header: "Bergabung",
      render: (row) =>
        new Date(row.joinedAt).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      hideOnMobile: true,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-1000">Karyawan</h2>
          <p className="text-sm text-gray-700">
            Kelola akun Owner dan Cashier di semua cabang.
          </p>
        </div>
        {canManage && (
          <Button leftIcon={<Plus size={16} />} onClick={openCreateModal}>
            Karyawan Baru
          </Button>
        )}
      </div>

      <Select
        options={ROLE_FILTER_OPTIONS}
        value={roleFilter}
        onChange={(e) => setRoleFilter(e.target.value)}
        className="sm:max-w-52"
        aria-label="Filter role"
      />

      {error && (
        <Alert variant="error" title="Gagal memuat daftar karyawan">
          {error}
        </Alert>
      )}

      <Card>
        {!isLoading && !error && (employees?.length ?? 0) === 0 ? (
          <EmptyState
            icon={Users}
            title="Belum ada karyawan"
            description="Tambahkan Owner atau Cashier pertama untuk mulai operasional."
            action={
              canManage && (
                <Button leftIcon={<Plus size={16} />} onClick={openCreateModal}>
                  Karyawan Baru
                </Button>
              )
            }
          />
        ) : (
          <Table
            columns={columns}
            data={employees ?? []}
            isLoading={isLoading}
            getRowKey={(row) => row._id}
            onRowClick={(row) => navigate(`/dashboard/employees/${row._id}`)}
          />
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Karyawan Baru"
        description="Akun & password ini langsung dipakai buat login ke portal internal, gak perlu daftar di tempat lain lagi."
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button form="employee-form" type="submit" isLoading={isSubmitting}>
              Tambah Karyawan
            </Button>
          </>
        }>
        <form
          id="employee-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-4">
          {formError && (
            <Alert variant="error" title="Gagal menambahkan karyawan">
              {formError}
            </Alert>
          )}
          <Input
            label="Nama Lengkap"
            placeholder="Budi Santoso"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="budi@tokokamu.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="Minimal 8 karakter"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <Select
            label="Role"
            options={CREATABLE_ROLES}
            value={form.role}
            onChange={(e) =>
              setForm({ ...form, role: e.target.value as InternalRole })
            }
          />
          {form.role === "CASHIER" && (
            <Select
              label="Cabang Tugas"
              options={
                (branches ?? []).length > 0
                  ? (branches ?? []).map((b) => ({
                      label: b.name,
                      value: b._id,
                    }))
                  : [{ label: "Belum ada cabang", value: "" }]
              }
              value={form.branchId}
              onChange={(e) => setForm({ ...form, branchId: e.target.value })}
              required
            />
          )}
        </form>
      </Modal>
    </div>
  );
}
