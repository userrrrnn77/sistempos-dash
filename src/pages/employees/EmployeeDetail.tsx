// src/pages/employees/EmployeeDetail.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useFetch, extractErrorMessage } from "../../hooks/useFetch";
import { employeesService } from "../../services/employees";
import { branchesService } from "../../services/branches";
import type { InternalRole, UserStatus } from "../../types/auth";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { Select } from "../../components/ui/Select";
import { Input } from "../../components/ui/Input";
import { Alert } from "../../components/ui/Alert";
import { PageSpinner } from "../../components/ui/Spinner";
import { RoleBadge } from "../../components/RoleBadge";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";

const STATUS_OPTIONS: { label: string; value: UserStatus }[] = [
  { label: "Aktif", value: "active" },
  { label: "Nonaktif", value: "inactive" },
  { label: "Suspend", value: "suspended" },
];

const ROLE_OPTIONS: { label: string; value: InternalRole }[] = [
  { label: "Owner", value: "OWNER" },
  { label: "Cashier", value: "CASHIER" },
];

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { guardMutation } = useAuth();
  const { showToast } = useToast();

  const {
    data: employee,
    isLoading,
    error,
  } = useFetch(() => employeesService.getById(id as string), [id]);

  const { data: branches } = useFetch(() => branchesService.getAll(), []);

  const [name, setName] = useState("");
  const [role, setRole] = useState<InternalRole>("CASHIER");
  const [status, setStatus] = useState<UserStatus>("active");
  const [branchId, setBranchId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Sinkronkan form state begitu data employee selesai di-fetch.
  useEffect(() => {
    if (!employee) return;
    setName(employee.name);
    setRole(employee.role === "DEVELOPER" ? "OWNER" : employee.role);
    setStatus(employee.status);
    setBranchId(
      typeof employee.branchId === "string"
        ? employee.branchId
        : (employee.branchId?._id ?? ""),
    );
  }, [employee]);

  const handleSave = async () => {
    if (!guardMutation() || !id) return;

    if (role === "CASHIER" && !branchId) {
      setSaveError("Kasir wajib ditugaskan ke satu cabang, Bre!");
      return;
    }

    setSaveError(null);
    setIsSaving(true);
    try {
      await employeesService.update(id, {
        name,
        role,
        status,
        branchId: role === "CASHIER" ? branchId : undefined,
      });
      showToast({ variant: "success", title: "Data karyawan diperbarui" });
    } catch (err) {
      setSaveError(extractErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await employeesService.remove(id);
      showToast({ variant: "success", title: "Karyawan berhasil dihapus" });
      navigate("/dashboard/employees");
    } catch (err) {
      showToast({
        variant: "error",
        title: "Gagal menghapus karyawan",
        description: extractErrorMessage(err),
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<ArrowLeft size={15} />}
        onClick={() => navigate("/dashboard/employees")}
        className="w-fit">
        Kembali ke Karyawan
      </Button>

      {error && (
        <Alert variant="error" title="Gagal memuat data karyawan">
          {error}
        </Alert>
      )}

      {isLoading && <PageSpinner />}

      {!isLoading && employee && (
        <Card>
          <CardHeader
            title={
              <div className="flex items-center gap-2">
                <span>{employee.name}</span>
                <RoleBadge role={employee.role} />
              </div>
            }
            description={employee.email}
            action={
              employee.role !== "DEVELOPER" && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Hapus karyawan"
                  onClick={() => {
                    if (!guardMutation()) return;
                    setIsDeleteOpen(true);
                  }}>
                  <Trash2 size={16} className="text-red-700" />
                </Button>
              )
            }
          />
          <CardContent>
            {employee.role === "DEVELOPER" ? (
              <Alert variant="info" title="Akun Developer">
                Akun dengan kasta DEVELOPER tidak bisa diubah maupun dihapus
                lewat portal ini.
              </Alert>
            ) : (
              <div className="flex flex-col gap-4">
                {saveError && (
                  <Alert variant="error" title="Gagal menyimpan">
                    {saveError}
                  </Alert>
                )}

                <Input
                  label="Nama Lengkap"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Select
                    label="Role"
                    options={ROLE_OPTIONS}
                    value={role}
                    onChange={(e) => setRole(e.target.value as InternalRole)}
                  />
                  <Select
                    label="Status"
                    options={STATUS_OPTIONS}
                    value={status}
                    onChange={(e) => setStatus(e.target.value as UserStatus)}
                  />
                </div>

                {role === "CASHIER" && (
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
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                  />
                )}

                <div className="flex justify-end">
                  <Button
                    leftIcon={<Save size={15} />}
                    onClick={handleSave}
                    isLoading={isSaving}>
                    Simpan Perubahan
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title={`Hapus karyawan "${employee?.name}"?`}
        description="Aksi ini permanen dan akan dicatat di audit log."
      />
    </div>
  );
}
