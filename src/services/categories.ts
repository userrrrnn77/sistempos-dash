import api from "./api";
import type { Category } from "../types/api";

export interface CreateCategoryPayload {
  name: string;
  variantLabels: string[];
}

export interface UpdateCategoryPayload {
  name?: string;
  variantLabels?: string[];
}

export const categoriesService = {
  async getAll(): Promise<Category[]> {
    const { data } = await api.get<{ data: Category[] }>("/categories");
    return data.data;
  },

  async getById(id: string): Promise<Category> {
    const { data } = await api.get<{ data: Category }>(`/categories/${id}`);
    return data.data;
  },

  async create(payload: CreateCategoryPayload): Promise<Category> {
    const { data } = await api.post<{ data: Category }>("/categories", payload);
    return data.data;
  },

  async update(id: string, payload: UpdateCategoryPayload): Promise<Category> {
    const { data } = await api.patch<{ data: Category }>(
      `/categories/${id}`,
      payload,
    );
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  },
};
