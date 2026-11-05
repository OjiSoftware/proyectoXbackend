export type CreateProductInput = {
    name: string;
    description?: string | null;
    unit?: string | null;
    price: number;
    costPrice?: number | null;
    barcode?: string | null;
    imageUrl: string;
    stock: number;
    brandId?: number | null;
    categoryId: number;
    status?: boolean;
    isOffer?: boolean
    showingInCatalog?: boolean;
};

export type UpdateProductInput = {
    name?: string;
    description?: string;
    unit?: string;
    price?: number;
    costPrice?: number | null;
    barcode?: string | null;
    imageUrl?: string;
    stock?: number;
    brandId?: number | null;
    categoryId?: number;
    status?: boolean;
    isOffer?: boolean
    showingInCatalog?: boolean;
};
