import { Request, Response } from "express";
import * as providerService from "../services/provider.service";
import { CreateProviderInput } from "../types/provider.types";

const providerFields: (keyof CreateProviderInput)[] = [
    "name",
    "businessName",
    "phoneNumber",
    "email",
];

const isProviderInput = (value: unknown): value is CreateProviderInput => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return false;
    }

    const input = value as Record<string, unknown>;

    return Object.entries(input).every(
        ([key, fieldValue]) =>
            providerFields.includes(key as keyof CreateProviderInput) &&
            (fieldValue === null || typeof fieldValue === "string"),
    );
};

const parseProviderId = (value: string | string[]): number | null => {
    if (typeof value !== "string") return null;
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
};

export const getProviders = async (_req: Request, res: Response) => {
    try {
        res.json(await providerService.getAllProviders());
    } catch {
        res.status(500).json({ message: "Error al obtener los proveedores" });
    }
};

export const getProvider = async (req: Request, res: Response) => {
    const id = parseProviderId(req.params.id);
    if (id === null) {
        return res.status(400).json({ message: "ID de proveedor inválido" });
    }

    try {
        res.json(await providerService.getProviderById(id));
    } catch (error) {
        if (error instanceof Error && error.message === "Proveedor no encontrado") {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: "Error al obtener el proveedor" });
    }
};

export const createProvider = async (req: Request, res: Response) => {
    if (!isProviderInput(req.body)) {
        return res.status(400).json({
            message: "Los campos del proveedor deben ser texto o null",
        });
    }

    try {
        res.status(201).json(await providerService.createProvider(req.body));
    } catch {
        res.status(500).json({ message: "Error al crear el proveedor" });
    }
};

export const updateProvider = async (req: Request, res: Response) => {
    const id = parseProviderId(req.params.id);
    if (id === null) {
        return res.status(400).json({ message: "ID de proveedor inválido" });
    }
    if (!isProviderInput(req.body)) {
        return res.status(400).json({
            message: "Los campos del proveedor deben ser texto o null",
        });
    }

    try {
        res.json(await providerService.modifyProvider(id, req.body));
    } catch (error) {
        if (error instanceof Error && error.message === "Proveedor no encontrado") {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: "Error al actualizar el proveedor" });
    }
};

export const deleteProvider = async (req: Request, res: Response) => {
    const id = parseProviderId(req.params.id);
    if (id === null) {
        return res.status(400).json({ message: "ID de proveedor inválido" });
    }

    try {
        res.json(await providerService.removeProvider(id));
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "Proveedor no encontrado") {
                return res.status(404).json({ message: error.message });
            }
            if (error.message === "PROVIDER_IN_USE") {
                return res.status(409).json({
                    message: "No se puede eliminar el proveedor porque tiene productos asociados",
                });
            }
        }
        res.status(500).json({ message: "Error al eliminar el proveedor" });
    }
};
