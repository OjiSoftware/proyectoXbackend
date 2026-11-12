import * as providerRepo from "../repositories/provider.repository";
import { Provider as ProviderModel } from "../generated/prisma/client";
import {
    CreateProviderInput,
    UpdateProviderInput,
} from "../types/provider.types";

export const getAllProviders = async (): Promise<ProviderModel[]> => {
    return providerRepo.findAllProviders();
};

export const getProviderById = async (
    id: number,
): Promise<ProviderModel> => {
    const provider = await providerRepo.findProviderById(id);
    if (!provider) throw new Error("Proveedor no encontrado");
    return provider;
};

export const createProvider = async (
    data: CreateProviderInput,
): Promise<{ message: string; provider: ProviderModel }> => {
    const provider = await providerRepo.insertProvider(data);
    return { message: "Proveedor creado con éxito", provider };
};

export const modifyProvider = async (
    id: number,
    data: UpdateProviderInput,
): Promise<{ message: string; provider: ProviderModel }> => {
    const provider = await providerRepo.updateProvider(id, data);
    if (!provider) throw new Error("Proveedor no encontrado");
    return { message: "Proveedor actualizado con éxito", provider };
};

export const removeProvider = async (
    id: number,
): Promise<{ message: string; provider: ProviderModel }> => {
    const provider = await providerRepo.deleteProvider(id);
    if (!provider) throw new Error("Proveedor no encontrado");
    return { message: "Proveedor eliminado con éxito", provider };
};
