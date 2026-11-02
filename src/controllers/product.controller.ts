// src/controllers/product.controller.ts
import { Request, Response } from "express";
import * as productService from "../services/product.service";

/**
 * Obtiene todos los productos activos
 */
export const getProducts = async (_req: Request, res: Response) => {
    try {
        const products = await productService.getAllProducts();
        res.json(products);
    } catch (error: any) {
        res.status(500).json({ message: "Error al obtener los productos" });
    }
};

/**
 * Obtiene un producto por ID
 */
export const getProduct = async (req: Request, res: Response) => {
    try {
        const product = await productService.getProductById(
            Number(req.params.id),
        );
        res.json(product);
    } catch (error: any) {
        if (error.message === "Producto no encontrado") {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: "Error al obtener el producto" });
    }
};

/**
 * Crea un nuevo producto
 */
export const createProduct = async (req: Request, res: Response) => {
    try {
        /* control barcode */

        const barcodeError = validateBarcode(req.body?.barcode);

        if (barcodeError) {
            return res.status(400).json({ message: barcodeError });
        }
        

        /* fin control barcode */

        const result = await productService.createProduct(req.body);
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * Actualiza un producto existente
 */
export const updateProduct = async (req: Request, res: Response) => {
    try {

        const barcodeError = validateBarcode(req.body?.barcode);

        if (barcodeError) {
            return res.status(400).json({ message: barcodeError });
        }

        const result = await productService.updateProduct(
            Number(req.params.id),
            req.body,
        );
        res.json(result);
    } catch (error: any) {
        if (error.message === "Producto no encontrado") {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: "Error al actualizar el producto" });
    }
};

/**
 * Elimina un producto
 */
export const disableProduct = async (req: Request, res: Response) => {
    try {
        const result = await productService.disableProduct(
            Number(req.params.id),
        );
        res.json(result);
    } catch (error: any) {
        if (error.message === "Producto no encontrado") {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: "Error al eliminar el producto" });
    }
};


export const getCatalog = async (_req: Request, res: Response) => {
    try {

        const result = await productService.getCatalogProducts()

        return res.json(result)
    } catch (error) {
        console.log("Error en getCatalog en el controller", error)
        res.status(500).json({ message: "Algo salio mal en el controller" })
    }
}


/* Verifica BarCode */

const validateBarcode =  (value: unknown): string | null => {
    
    if (value === undefined || value === null) return null;

    if ( typeof value !=="string" || !/^[0-9]+$/.test(value) ){
        return "El código de barras debe contener solo digitos";
    }

    if (![8, 12, 13, 14].includes(value.length)) {
        return "El codigo debe tener una longitud de 8, 12, 13 o 14 digitos";
    }

    const digitsBeforeCheck = value
        .slice(0, -1)
        .split("")
        .reverse();

    const sum = digitsBeforeCheck.reduce((total, digit, index) =>
        total + Number (digit) * (index % 2 === 0 ? 3 : 1), 
        0,
    );

    const expectedCheckDigit = (10 - (sum % 10)) % 10;
    const actualCheckDigit = Number(value[value.length - 1]);

    if (actualCheckDigit !== expectedCheckDigit) {
        return "El dígito de control del código de barras no es válido.";
    }

    return null;
}