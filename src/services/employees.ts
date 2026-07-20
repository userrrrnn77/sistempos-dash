// src/services/employees.ts
import api from "./api";
import { isDemoModeActive, DEMO_EMPLOYEES } from "../utils/demoMockData";
import type { Employee } from "../types/api";
import type { InternalRole, UserStatus } from "../types/auth";

export interface CreateEmployeePayload {
  name: string;
  email: string;
  password: string;
  role: InternalRole;
  branchId?: string;
}

export interface UpdateEmployeePayload {
  name?: string;
  role?: InternalRole;
  status?: UserStatus;
  branchId?: string;
}

export const employeesService = {
  /**
   * 🎭 Mode Demo: data karyawan asli disembunyikan, ganti dengan dummy data
   * biar halaman Karyawan tetap kelihatan bentuknya buat demo.
   */
  async getAll(params?: {
    role?: InternalRole;
    status?: UserStatus;
  }): Promise<Employee[]> {
    if (isDemoModeActive()) {
      return DEMO_EMPLOYEES.filter(
        (e) =>
          (!params?.role || e.role === params.role) &&
          (!params?.status || e.status === params.status),
      );
    }
    const { data } = await api.get<{ data: Employee[] }>("/employees", {
      params,
    });
    return data.data;
  },

  async getById(id: string): Promise<Employee> {
    if (isDemoModeActive()) {
      const found = DEMO_EMPLOYEES.find((e) => e._id === id);
      if (!found) throw new Error("Karyawan demo tidak ditemukan, Bre!");
      return found;
    }
    const { data } = await api.get<{ data: Employee }>(`/employees/${id}`);
    return data.data;
  },

  async create(payload: CreateEmployeePayload): Promise<Employee> {
    const { data } = await api.post<{ data: Employee }>("/employees", payload);
    return data.data;
  },

  async update(id: string, payload: UpdateEmployeePayload): Promise<Employee> {
    const { data } = await api.patch<{ data: Employee }>(
      `/employees/${id}`,
      payload,
    );
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/employees/${id}`);
  },
};
