const express = require("express");
const router = express.Router();
const { Categories, Products } = require("../models");
const checkAuth = require("../middleware/auth");
const multer = require("multer");
const { response, responseWithData } = require("../middleware/response");
const sharp = require("sharp");


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/category");
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

const checkFile = handleUploadError(upload.single("icon"))

router.post("/", checkAuth, checkFile, async (req, res) => {
    if (!req.file) {
        return res.status(422).json(response(422, 'Picture is required'));
    }
    const icon = req.file.filename;
    const { name } = req.body;
    try {
        if (typeof name !== 'string' || name.length > 20) {
            return res.status(422).json(response(422, 'Name must be a string, max 20 characters'));
        }
        if (req.authenticatedUser.role !== "admin") {
            return res.status(403).json(response(403, "Only admin can manage categories"));
        }
        const existingCategory = await Categories.findOne({ where: { name } });
        if (existingCategory) {
            return res.status(422).json(response(422, "Category name already exist"));
        }

        const imagePath = 'uploads/category/' + icon;
        const processedImagePath = 'uploads/category/processed_' + icon;

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

        const newCategory = await Categories.create({
            name,
            icon: req.protocol + "://" + req.get("host") + "/" + processedImagePath,
        });
        return res.status(201).json(responseWithData(201, newCategory, "Successfully create category"));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error });
    }
});

router.put("/:id", checkAuth, checkFile, async (req, res) => {
    if (!req.file) {
        return res.status(422).json(response(422, 'Picture is required'));
    }
    const categoryId = req.params.id;
    const { name } = req.body;

    try {
        if (req.authenticatedUser.role !== "admin") {
            return res.status(403).json(response(403, "Only admin can manage categories"));
        }
        if (typeof name !== 'string' || name.length > 20) {
            return res.status(422).json(response(422, 'Name must be a string, max 20 characters'));
        }
        if (categoryId === "1" || categoryId === "2" || categoryId === "3") {
            return res.status(403).json(response(403, "Default categories cannot be edited"));
        }

        const existingCategory = await Categories.findOne({ where: { name } });
        if (existingCategory) {
            return res.status(422).json(response(422, "Category name already exist"));
        }

        const categoryToUpdate = await Categories.findByPk(categoryId);
        if (!categoryToUpdate) {
            return res.status(404).json(response(404, "Category not found"));
        }

        categoryToUpdate.name = name || categoryToUpdate.name;
        if (req.file) {
            var icon = req.file.filename;
            const imagePath = 'uploads/category/' + icon;
            const processedImagePath = 'uploads/category/processed_' + icon;
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
            categoryToUpdate.icon = req.protocol + "://" + req.get("host") + "/" + processedImagePath;
        }

        await categoryToUpdate.save();
        const updatedCategory = {
            id: categoryToUpdate.id,
            name: categoryToUpdate.name,
            icon: categoryToUpdate.icon,
            createdAt: categoryToUpdate.createdAt,
            updatedAt: categoryToUpdate.updatedAt,
        };

        return res.status(200).json(responseWithData(200, updatedCategory, "Successfully update category"));

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error });
    }
});

router.delete("/:id", checkAuth, async (req, res) => {
    try {
        if (req.authenticatedUser.role !== "admin") {
            return res.status(403).json(response(403, "Only admin can manage categories"));
        }

        const category = await Categories.findByPk(req.params.id);
        if (!category) {
            return res.status(404).json(response(404, "Category not found"));
        }

        await category.destroy();
        return res.status(200).json(response(200, "Successfully delete category"));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error });
    }
});

router.get("/", async (req, res) => {
    try {
        const categories = await Categories.findAll({
            attributes: { exclude: ["deletedAt"] }
        });
        return res.status(200).json(responseWithData(200, categories, "Successfully get category list"));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const categoryId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const per_page = parseInt(req.query.per_page) || 9;
        const category = await Categories.findByPk(categoryId, {
            attributes: {
                exclude: ["deletedAt"],
            },
            include: [
                {
                    model: Products,
                    attributes: {
                        exclude: ["deletedAt", "categoryId", "userId"],
                    },
                    as: "products",
                    offset: (page - 1) * per_page,
                    limit: per_page,
                },
            ],
        });

        if (!category) {
            return res.status(404).json(response(404, "Category not found"));
        }

        const total = await Products.count({
            where: { categoryId: categoryId },
        });

        const responsePayload = {
            id: category.id,
            name: category.name,
            icon: category.icon,
            total: total,
            page: page,
            per_page: per_page,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
            products: category.products,
        };

        return res.status(200).json(responseWithData(200, responsePayload, "Successfully get category detail"));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error });
    }
});


module.exports = router;
