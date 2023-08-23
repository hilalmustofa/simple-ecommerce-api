const express = require("express");
const router = express.Router();
const { Categories, Products } = require("../models");
const checkAuth = require("../middleware/auth");
const multer = require("multer");

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

router.post("/", checkAuth, upload.single("icon"), async (req, res) => {
    const icon = req.file.filename;
    const { name } = req.body;
    try {
        if (req.authenticatedUser.role !== "admin") {
            return res.status(403).json({ message: "Only admin can manage categories" });
        }
        const existingCategory = await Categories.findOne({ where: { name } });
        if (existingCategory) {
            return res.status(422).json({
                message: "Category name already exist",
            });
        }
        const newCategory = await Categories.create({
            name,
            icon: req.protocol + "://" + req.get("host") + "/uploads/category/" + icon,
        });
        res.status(201).json(newCategory);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error });
    }
});

router.put("/:id", checkAuth, upload.single("icon"), async (req, res) => {
    const categoryId = req.params.id;
    const { name } = req.body;

    try {
        if (req.authenticatedUser.role !== "admin") {
            return res.status(403).json({ message: "Only admin can manage categories" });
        }

        const existingCategory = await Categories.findOne({ where: { name } });
        if (existingCategory) {
            return res.status(422).json({
                message: "Category name already exist",
            });
        }

        const categoryToUpdate = await Categories.findByPk(categoryId);
        if (!categoryToUpdate) {
            return res.status(404).json({ message: "Category not found" });
        }

        categoryToUpdate.name = name || categoryToUpdate.name;
        if (req.file) {
            categoryToUpdate.icon = req.protocol + "://" + req.get("host") + "/uploads/avatar/" + req.file.filename;
        }

        await categoryToUpdate.save();
        const updatedCategory = {
            id: categoryToUpdate.id,
            name: categoryToUpdate.name,
            icon: categoryToUpdate.icon,
            createdAt: categoryToUpdate.createdAt,
            updatedAt: categoryToUpdate.updatedAt,
        };

        return res.status(200).json({
            message: "Category updated successfully",
            ...updatedCategory
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error });
    }
});

router.delete("/:id", checkAuth, async (req, res) => {
    try {
        if (req.authenticatedUser.role !== "admin") {
            return res.status(403).json({ message: "Only admin can manage categories" });
        }

        const category = await Categories.findByPk(req.params.id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        await category.destroy();
        res.json({ message: "Category successfully deleted" });
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
        res.json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const categoryId = req.params.id;
        const page = req.query.page || 1;
        const pageSize = 10;

        const category = await Categories.findByPk(categoryId, {
            attributes: {
                exclude: ["deletedAt"],
            },
            include: [
                {
                    model: Products,
                    attributes: {
                        exclude: ["deletedAt", "categoryId"],
                    },
                    as: "products",
                    offset: (page - 1) * pageSize,
                    limit: pageSize,
                },
            ],
        });

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        res.json(category);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error });
    }
});

module.exports = router;
