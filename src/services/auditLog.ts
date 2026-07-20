// src/services/auditLog.ts
import api from "./api";
import { isDemoModeActive } from "../utils/demoMockData";
import type { AuditLog, AuditLogPagination } from "../types/api";
import type { InternalRole } from "../types/auth";

export interface GetAuditLogParams {
  action?: string;
  actorId?: string;
  actorRole?: InternalRole;
  targetCollection?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface GetAuditLogResult {
  data: AuditLog[];
  pagination: AuditLogPagination;
}

export const auditLogService = {
  /**
   * 🎭 Mode Demo: audit log disembunyikan total, gak hit API asli —
   * langsung return list kosong biar gak ada 401.
   */
  async getAll(params?: GetAuditLogParams): Promise<GetAuditLogResult> {
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
    const { data } = await api.get<GetAuditLogResult>("/audit-log", {
      params,
    });
    return data;
  },
};
