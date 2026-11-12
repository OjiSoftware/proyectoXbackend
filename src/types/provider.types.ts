export type CreateProviderInput = {
    name?: string | null;
    businessName?: string | null;
    phoneNumber?: string | null;
    email?: string | null;
};

export type UpdateProviderInput = Partial<CreateProviderInput>;
