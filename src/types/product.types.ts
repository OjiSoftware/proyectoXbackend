export type CreateProductInput = {
    name: string;
    description: string | null;
    unit: string | null;
    price: number;
    imageUrl: string;
    stock: number;
    brandId: number | null;
    subCategoryId: number;
    status?: boolean;
    showingInCatalog?: boolean;
};

export type UpdateProductInput = {
    name?: string;
    description?: string;
    unit?: string;
    price?: number;
    imageUrl?: string;
    stock?: number;
    brandId?: number | null;
    subCategoryId?: number;
    status?: boolean;
    showingInCatalog?: boolean;
};
