// src/services/branches.ts
import api from "./api";
import type { Branch } from "../types/api";

export interface CreateBranchPayload {
  name: string;
  address: string;
  phone: string;
}

export interface UpdateBranchPayload {
  name?: string;
  address?: string;
  phone?: string;
}

export const branchesService = {
  async getAll(): Promise<Branch[]> {
    const { data } = await api.get<{ data: Branch[] }>("/branches");
    return data.data;
  },

  async getById(id: string): Promise<Branch> {
    const { data } = await api.get<{ data: Branch }>(`/branches/${id}`);
    return data.data;
  },

  async create(payload: CreateBranchPayload): Promise<Branch> {
    const { data } = await api.post<{ data: Branch }>("/branches", payload);
    return data.data;
  },

  async update(id: string, payload: UpdateBranchPayload): Promise<Branch> {
    const { data } = await api.patch<{ data: Branch }>(
      `/branches/${id}`,
      payload,
    );
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/branches/${id}`);
  },
};
