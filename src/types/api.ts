// src/types/api.ts
// Tipe-tipe domain data, harus tetap sinkron dengan Mongoose models di backend (backend/src/models/*.ts)

import type { InternalRole, UserStatus } from "./auth";

export interface Branch {
  _id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  /** ["S","M","L","XL","XXL"] atau [] kalau kategori ini gak punya varian */
  variantLabels: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  url: string;
  /** Gambar yang dipakai sebagai cover di card katalog. Cuma boleh satu per produk. */
  isCover: boolean;
}

export interface VariantStock {
  branchId: string;
  qty: number;
}

export interface ProductVariant {
  /** Label varian, sesuai Category.variantLabels (mis. "M", "500ml"), atau "-" kalau kategori tanpa varian. */
  label: string;
  stocks: VariantStock[];
}

export interface Product {
  _id: string;
  name: string;
  sku: string;
  description?: string;
  price: number;
  categoryId: string | Pick<Category, "_id" | "name" | "variantLabels">;
  images: ProductImage[];
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  _id: string;
  supabaseId: string;
  name: string;
  email: string;
  role: InternalRole;
  /** Cabang tempat kasir ditugaskan. Cuma relevan untuk role CASHIER. */
  branchId?: string | Pick<Branch, "_id" | "name">;
  status: UserStatus;
  joinedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export type CustomerStatus = "active" | "suspended" | "banned";

export interface Customer {
  _id: string;
  supabaseId: string;
  name: string;
  email: string;
  phone?: string;
  address?: CustomerAddress;
  isAddressComplete: boolean;
  status?: CustomerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId:
    | string
    | Pick<Product, "_id" | "name" | "sku" | "images" | "price" | "variants">;
  variantLabel: string;
  branchId: string | Pick<Branch, "_id" | "name" | "code" | "address">;
  qty: number;
  price: number;
  /** Dihitung backend: price * qty */
  lineTotal: number;
}

export interface CartBranchGroup {
  branch: string | Pick<Branch, "_id" | "name" | "code" | "address">;
  items: CartItem[];
  /** Total harga khusus item dari cabang ini */
  subtotal: number;
}

export interface Cart {
  _id: string;
  customerId: string;
  /** Item digroup per cabang, karena satu keranjang bisa berisi barang dari beberapa cabang sekaligus */
  branches: CartBranchGroup[];
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionItem {
  productId: string;
  name: string;
  /** "-" untuk produk tanpa varian */
  variantLabel: string;
  /** Cabang asal barang ini terjual/dipotong stoknya */
  branchId: string | Pick<Branch, "_id" | "name" | "address">;
  price: number;
  qty: number;
  subTotal: number;
}

export type TransactionSource = "CASHIER" | "E-COMMERCE";
export type PaymentMethod = "CASH" | "QRIS" | "DEBIT";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED";

export interface Transaction {
  _id: string;
  invoiceNumber: string;
  source: TransactionSource;
  /**
   * WAJIB ada untuk source CASHIER (kasir selalu transaksi dari 1 cabang fisik).
   * KOSONG/undefined untuk source E-COMMERCE — 1 invoice customer bisa berisi barang
   * dari beberapa cabang sekaligus, jadi cabang dilihat per-item lewat items[].branchId.
   */
  branchId?: string | Pick<Branch, "_id" | "name" | "address">;
  cashierId?: string | { _id: string; name: string; email: string };
  customerId?: string | { _id: string; name: string; email: string };
  items: TransactionItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export type AuditAction =
  | "DELETE_BRANCH"
  | "DELETE_PRODUCT"
  | "DELETE_EMPLOYEE"
  | "UPDATE_CUSTOMER_STATUS"
  | (string & {});

export interface AuditLog {
  _id: string;
  actorId:
    | string
    | { _id: string; name: string; email: string; role: InternalRole };
  actorRole: InternalRole;
  action: AuditAction;
  targetCollection: string;
  targetId?: string;
  description: string;
  createdAt: string;
}

export interface AuditLogPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DailyIncomeSummary {
  date: string;
  branchId: string; // bisa berisi literal "ALL_BRANCHES" kalau tidak difilter per cabang
  totalTransactions: number;
  summary: {
    totalIncome: number;
    cashAmount: number;
    qrisAmount: number;
    debitAmount: number;
  };
}

export interface FulfillmentOrder {
  _id: string;
  invoiceNumber: string;
  customerId?:
    | string
    | { _id: string; name: string; email: string; phone?: string };
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
  /** Sudah difilter backend: cuma item yang branchId-nya cocok cabang yang diminta */
  items: TransactionItem[];
  /** Subtotal khusus item cabang ini, bukan totalAmount invoice penuh */
  branchSubtotal: number;
  /** true kalau invoice ini sebenarnya juga punya item di cabang lain */
  isMultiBranchOrder: boolean;
}

export interface TransactionListResult {
  data: Transaction[];
  pagination: AuditLogPagination;
}
