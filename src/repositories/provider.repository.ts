import { prisma } from "../prisma";
import { Prisma, Provider as ProviderModel } from "../generated/prisma/client";
import {
    CreateProviderInput,
    UpdateProviderInput,
} from "../types/provider.types";

export const findAllProviders = async (): Promise<ProviderModel[]> => {
    try {
        return await prisma.provider.findMany({
            orderBy: { id: "asc" },
        });
    } catch (error) {
        console.error("Error al obtener proveedores:", error);
        throw new Error("No se pudieron obtener los proveedores");
    }
};

export const findProviderById = async (
    id: number,
): Promise<ProviderModel | null> => {
    try {
        return await prisma.provider.findUnique({ where: { id } });
    } catch (error) {
        console.error(`Error al buscar proveedor con id ${id}:`, error);
        throw new Error("No se pudo buscar el proveedor");
    }
};

export const insertProvider = async (
    data: CreateProviderInput,
): Promise<ProviderModel> => {
    try {
        return await prisma.provider.create({ data });
    } catch (error) {
        console.error("Error al crear proveedor:", error);
        throw new Error("No se pudo crear el proveedor");
    }
};

export const updateProvider = async (
    id: number,
    data: UpdateProviderInput,
): Promise<ProviderModel | null> => {
    try {
        return await prisma.provider.update({
            where: { id },
            data,
        });
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2025"
        ) {
            return null;
        }

        console.error(`Error al actualizar proveedor con id ${id}:`, error);
        throw new Error("No se pudo actualizar el proveedor");
    }
};

export const deleteProvider = async (
    id: number,
): Promise<ProviderModel | null> => {
    try {
        return await prisma.provider.delete({ where: { id } });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2025") return null;
            if (error.code === "P2003") {
                throw new Error("PROVIDER_IN_USE");
            }
        }

        console.error(`Error al eliminar proveedor con id ${id}:`, error);
        throw new Error("No se pudo eliminar el proveedor");
    }
};
