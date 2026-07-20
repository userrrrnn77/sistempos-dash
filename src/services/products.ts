import api from "./api";
import type { Product } from "../types/api";

export interface CreateProductPayload {
  name: string;
  sku: string;
  description?: string;
  price: number;
  categoryId: string;
  branchId?: string;
  initialQty?: number;
  /** Array mime-type gambar, mis. ["image/png","image/jpeg"]. Gambar pertama otomatis jadi cover. */
  imageTypes?: string[];
}

export interface UpdateProductInfoPayload {
  name?: string;
  price?: number;
  description?: string;
  categoryId?: string;
}

export interface CreateProductResponse {
  product: Product;
  /** Presigned upload URL R2, urutannya sama persis dengan imageTypes yang dikirim. */
  uploadUrls: string[];
}

export interface AddImagesResponse {
  data: Product;
  uploadUrls: string[];
}

export const productsService = {
  async getAll(params?: {
    branchId?: string;
    categoryId?: string;
    search?: string;
  }): Promise<Product[]> {
    const { data } = await api.get<{ data: Product[] }>("/products", {
      params,
    });
    return data.data;
  },

  async getById(id: string): Promise<Product> {
    const { data } = await api.get<{ data: Product }>(`/products/${id}`);
    return data.data;
  },

  async create(payload: CreateProductPayload): Promise<CreateProductResponse> {
    const { data } = await api.post<CreateProductResponse>(
      "/products",
      payload,
    );
    return data;
  },

  async updateInfo(
    id: string,
    payload: UpdateProductInfoPayload,
  ): Promise<Product> {
    const { data } = await api.patch<{ data: Product }>(
      `/products/${id}/info`,
      payload,
    );
    return data.data;
  },

  /** Mutasi stok 1 varian di 1 cabang. Kasir cuma boleh nambah (qtyChange positif). */
  async updateStock(
    id: string,
    branchId: string,
    variantLabel: string,
    qtyChange: number,
  ): Promise<Product> {
    const { data } = await api.patch<{ data: Product }>(
      `/products/${id}/stock`,
      { branchId, variantLabel, qtyChange },
    );
    return data.data;
  },

  /** Tambah gambar baru ke galeri produk. Response berisi presigned URL buat upload file-nya. */
  async addImages(
    id: string,
    imageTypes: string[],
  ): Promise<AddImagesResponse> {
    const { data } = await api.post<AddImagesResponse>(
      `/products/${id}/images`,
      { imageTypes },
    );
    return data;
  },

  async removeImage(id: string, url: string): Promise<Product> {
    const { data } = await api.post<{ data: Product }>(
      `/products/${id}/images/remove`,
      { url },
    );
    return data.data;
  },

  async setCoverImage(id: string, url: string): Promise<Product> {
    const { data } = await api.post<{ data: Product }>(
      `/products/${id}/images/cover`,
      { url },
    );
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  },
};
