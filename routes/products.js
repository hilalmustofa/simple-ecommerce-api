const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/auth");
const multer = require("multer");
const { Products } = require("../models");
const { up } = require("../migrations/1-create-users");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/product");
    },
    filename: function (req, file, cb) {
        const extension = file.mimetype.split("/")[1];
        const lowercasedName = req.body.name.toLowerCase();
        const formattedName = lowercasedName.replace(/ /g, '-');
        cb(null, formattedName + "." + extension);
    },
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
        cb(null, true);
    } else {
        cb(new Error("Only JPG and PNG files are allowed"), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024
    },
    fileFilter: fileFilter,
});

router.post("/", checkAuth, upload.single("picture"), async (req, res) => {
    const { categoryId, name, description, price, stock } = req.body;
    const picture = req.file.filename;

    try {
        const existingProduct = await Products.findOne({ where: { name } });
        if (existingProduct) {
            return res.status(422).json({
                message: "Product already exist",
            });
        }
        const newProduct = await Products.create({
            categoryId: parseInt(categoryId),
            name,
            picture: req.protocol + "://" + req.get("host") + "/uploads/product/" + picture,
            description,
            price,
            stock
        });
        const productResponse = {
            id: newProduct.id,
            categoryId: parseInt(newProduct.categoryId),
            name: newProduct.name,
            picture: newProduct.picture,
            description: newProduct.description,
            price: parseInt(newProduct.price),
            stock: parseInt(newProduct.stock),
            updatedAt: newProduct.updatedAt,
            createdAt: newProduct.createdAt,
        };

        return res.status(201).json(productResponse);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});

router.get("/", async (req, res) => {
    try {
        const allProducts = await Products.findAll({
            attributes: { exclude: ["deletedAt"] }
        });
        if (allProducts.length === 0) {
            return res.status(404).json({ message: "No products found, please create one" });
        }
        return res.status(200).json(allProducts);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});


router.get("/:productId", async (req, res) => {
    const { productId } = req.params;

    try {
        const product = await Products.findByPk(productId, {
            attributes: { exclude: ["deletedAt"] }
        });
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        return res.status(200).json(product);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});

router.put("/:productId", checkAuth, upload.single("picture"), async (req, res) => {
    const { productId } = req.params;
    const { name, picture, description, price, stock } = req.body;

    try {
        const productToUpdate = await Products.findByPk(productId);
        if (!productToUpdate) {
            return res.status(404).json({ message: "Product not found" });
        }
        if (req.file) {
            productToUpdate.picture = req.protocol + "://" + req.get("host") + "/uploads/product/" + req.file.filename;
        }
        const updatedProduct = await productToUpdate.update({ name, picture, description, price, stock });

        const productResponse = {
            id: updatedProduct.id,
            categoryId: parseInt(updatedProduct.categoryId),
            name: updatedProduct.name,
            picture: updatedProduct.picture,
            description: updatedProduct.description,
            price: parseInt(updatedProduct.price),
            stock: parseInt(updatedProduct.stock),
            updatedAt: updatedProduct.updatedAt,
            createdAt: updatedProduct.createdAt,
        };

        return res.status(201).json(productResponse);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});

router.delete("/:productId", checkAuth, async (req, res) => {
    const { productId } = req.params;

    try {
        const product = await Products.findByPk(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        await product.destroy();

        return res.status(200).json({ message: "Product successfully deleted" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});

module.exports = router;
