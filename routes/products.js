const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/auth");
const multer = require("multer");
const { Products } = require("../models");
const { response, responseWithData } = require("../middleware/response");
const sharp = require("sharp");

const formatRupiah = (money) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(money);
  };

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

function handleUploadError(multerUploadFunction) {
    return (req, res, next) =>
        multerUploadFunction(req, res, err => {
            if (err) {
                if (err instanceof multer.MulterError) {
                    if (err.code === "LIMIT_FILE_SIZE") {
                        return res.status(422).json(response(422, "File is too large"));
                    }
                } else {
                    return res.status(422).json(response(422, "File format is not supported, only JPG and PNG are allowed"));
                }
            }
            next();
        });
}

const fileFilter = (req, file, cb) => {
    if (file.mimetype == "image/jpeg" || file.mimetype === "image/png") {
        cb(null, true);
    } else {
        cb(null, false);
        return cb(new Error("invalid mimtype"));
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024
    },
    fileFilter: fileFilter,
});

const checkFile = handleUploadError(upload.single("picture"));

router.post("/", checkAuth, checkFile, async (req, res) => {
    const { categoryId, name, description, price, stock } = req.body;
    const userId = req.authenticatedUser.id;
    const picture = req.file.filename;

    try {
        const existingProduct = await Products.findOne({ where: { name } });
        if (existingProduct) {
            return res.status(422).json(response(422, 'Product name already exists'));
        }

        const imagePath = 'uploads/product/' + picture;
        const processedImagePath = 'uploads/product/processed_' + picture;

        const image = sharp(imagePath);

        const metadata = await image.metadata();
        const width = metadata.width;
        const height = metadata.height;

        const squareSize = Math.max(width, height);

        await sharp({
            create: {
                width: squareSize,
                height: squareSize,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            },
        })
            .composite([
                {
                    input: imagePath,
                    gravity: sharp.gravity.center,
                },
            ])
            .toFile(processedImagePath);

        const newProduct = await Products.create({
            userId,
            categoryId: parseInt(categoryId),
            name,
            picture: req.protocol + '://' + req.get('host') + '/' + processedImagePath,
            description,
            price,
            stock,
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

        return res.status(201).json(responseWithData(201, productResponse, "Successfully create product"));

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});

router.get("/", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const per_page = parseInt(req.query.per_page) || 9;

        const offset = (page - 1) * per_page;

        const allProducts = await Products.findAndCountAll({
            attributes: { exclude: ["deletedAt", "categoryId", "userId"] },
            limit: per_page,
            offset: offset,
        });

        if (allProducts.count === 0) {
            return res.status(404).json(response(404, "No products found, please create one"));
        }

        const total = allProducts.count;

        const responsePayload = {
            total: total,
            page: page,
            per_page: per_page,
            products: allProducts.rows,
        };

        return res.status(200).json(responseWithData(200, responsePayload, "Successfully get product list"));
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});



router.get("/:productId", async (req, res) => {
    const { productId } = req.params;

    try {
        const product = await Products.findByPk(productId, {
            attributes: { exclude: ["deletedAt", "categoryId", "userId"] }
        });
        if (!product) {
            return res.status(404).json(response(404, "Product not found"));
        }
        return res.status(200).json(responseWithData(200, product, "Successfully get product detail"));
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});

router.put("/:productId", checkAuth, checkFile, async (req, res) => {
    const { productId } = req.params;
    const { name, description, price, stock } = req.body;

    try {
        const productToUpdate = await Products.findByPk(productId);
        if (!productToUpdate) {
            return res.status(404).json(response(404, "Product not found"));
        }
        if (productToUpdate.userId !== req.authenticatedUser.id) {
            return res.status(403).json(response(403, "You are not owner of this product"));
        }
        if (req.file) {
            var picture = req.file.filename;
            const imagePath = 'uploads/product/' + picture;
        const processedImagePath = 'uploads/product/processed_' + picture;

        const image = sharp(imagePath);

        const metadata = await image.metadata();
        const width = metadata.width;
        const height = metadata.height;

        const squareSize = Math.max(width, height);

        await sharp({
            create: {
                width: squareSize,
                height: squareSize,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            },
        })
            .composite([
                {
                    input: imagePath,
                    gravity: sharp.gravity.center,
                },
            ])
            .toFile(processedImagePath);
            picture = req.protocol + '://' + req.get('host') + '/' + processedImagePath;
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

        return res.status(200).json(responseWithData(200, productResponse, "Successfully update product"));
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
            return res.status(404).json(response(404, "Product not found"));
        }
        if (product.userId !== req.authenticatedUser.id) {
            return res.status(403).json(response(403, "You are not owner of this product"));
        }

        await product.destroy();
        return res.status(200).json(response(200, "Successfully delete product"));
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});

module.exports = router;
