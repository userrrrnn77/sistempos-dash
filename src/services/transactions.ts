// src/services/transactions.ts
import api from "./api";
import { isDemoModeActive, getDemoDailyIncome } from "../utils/demoMockData";
import type {
  DailyIncomeSummary,
  FulfillmentOrder,
  PaymentMethod,
  Transaction,
  TransactionListResult,
} from "../types/api";

export interface CreateBillPayload {
  /**
   * Dipakai hanya kalau yang mencetak nota OWNER/DEVELOPER (lintas cabang).
   * Untuk role CASHIER, backend selalu pakai branchId dari profile kasir yang
   * login — field ini diabaikan meski dikirim.
   */
  branchId?: string;
  customerId?: string;
  items: { productId: string; variantLabel?: string; qty: number }[];
  paymentMethod: PaymentMethod;
}

export const transactionsService = {
  /** Cetak nota kasir (POS offline). */
  async createBill(payload: CreateBillPayload): Promise<Transaction> {
    const { data } = await api.post<{ data: Transaction }>(
      "/transactions/pos/bill",
      payload,
    );
    return data.data;
  },

  /**
   * Rangkuman omset harian (OWNER/DEVELOPER only).
   * 🎭 Mode Demo: data transaksi disembunyikan total, gak hit API asli —
   * langsung return rangkuman kosong biar gak ada 401/data bocor.
   */
  async getDailyIncome(params?: {
    branchId?: string;
    date?: string;
  }): Promise<DailyIncomeSummary> {
    if (isDemoModeActive()) {
      return getDemoDailyIncome(params?.branchId);
    }
    const { data } = await api.get<DailyIncomeSummary>(
      "/transactions/audit/daily",
      { params },
    );
    return data;
  },

  /**
   * Detail 1 nota dari sisi audit internal.
   * 🎭 Mode Demo: disembunyikan, lempar error biar caller nampilin state gagal
   * yang jelas alih-alih nembak API asli dan kena 401.
   */
  async searchAuditBills(id: string): Promise<Transaction[]> {
    if (isDemoModeActive()) {
      throw new Error("Detail transaksi tidak tersedia di Mode Demo, Bre!");
    }
    const { data } = await api.get<{ data: Transaction[] }>(
      `/transactions/audit/bill/${id}`,
    );
    return data.data;
  },

  /**
   * Daftar riwayat transaksi (paginasi), bisa difilter cabang/status/rentang tanggal.
   * Dipakai buat tabel Riwayat Pesanan — lengkapi getAuditDetail yang cuma bisa cari 1 nota by ID.
   * 🎭 Mode Demo: data transaksi disembunyikan total, langsung return list kosong.
   */
  async getList(params?: {
    branchId?: string;
    paymentStatus?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<TransactionListResult> {
    if (isDemoModeActive()) {
      return {
        data: [],
        pagination: {
          page: 1,
          limit: params?.limit ?? 20,
          total: 0,
          totalPages: 1,
        },
      };
    }
    const { data } = await api.get<TransactionListResult>(
      "/transactions/audit/list",
      { params },
    );
    return data;
  },

  /** Riwayat transaksi milik customer publik yang sedang login (jalur e-commerce, bukan internal). */
  async getEcommerceHistory(): Promise<Transaction[]> {
    const { data } = await api.get<{ data: Transaction[] }>(
      "/transactions/ecommerce/history",
    );
    return data.data;
  },

  /**
   * Daftar pesanan E-COMMERCE yang perlu di-fulfill dari 1 cabang tertentu.
   * Tiap invoice yang dikembalikan sudah dipangkas backend — cuma berisi item yang
   * branchId-nya cocok cabang ini, bukan seluruh isi invoice.
   */
  async getFulfillmentOrders(params: {
    branchId: string;
    paymentStatus?: string;
  }): Promise<FulfillmentOrder[]> {
    const { data } = await api.get<{ data: FulfillmentOrder[] }>(
      "/transactions/pos/fulfillment",
      { params },
    );
    return data.data;
  },
};
