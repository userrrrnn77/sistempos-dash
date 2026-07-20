// src/services/customers.ts
import api from "./api";
import type { Customer, CustomerStatus } from "../types/api";

export const customersService = {
  /** Cari member/customer publik berdasarkan nama, email, atau nomor telepon (dipakai kasir untuk diskon/cek fraud). */
  async search(query: string): Promise<Customer[]> {
    const { data } = await api.get<{ data: Customer[] }>("/customers/search", {
      params: { search: query },
    });
    return data.data;
  },

  /** Ubah status customer: active | suspended | banned (OWNER/DEVELOPER only). */
  async updateStatus(id: string, status: CustomerStatus): Promise<Customer> {
    const { data } = await api.patch<{ data: Customer }>(
      `/customers/${id}/status`,
      { status },
    );
    return data.data;
  },
};
