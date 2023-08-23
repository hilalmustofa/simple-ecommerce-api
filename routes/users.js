const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const express = require("express");
const router = express.Router();
const { Users } = require("../models");
const multer = require("multer");
require('dotenv').config();
const checkAuth = require("../middleware/auth");

router.get("/", checkAuth, async (req, res) => {
    const users = await Users.findAll({
        attributes: { exclude: ["password", "deletedAt"] }
    });
    if (!users.length) {
        return res.json({
            message: "User not found",
        });
    }
    res.json(users);
});

router.get("/:id", checkAuth, async (req, res) => {
    const userId = req.params.id;
    const user = await Users.findByPk(userId, {
        attributes: {
            exclude: ["deletedAt", "password"],
        }
    });
    if (!user) {
        return res.status(404).json({
            message: "User not found",
        });
    }
    res.json(user);
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/avatar");
    },
    filename: function (req, file, cb) {
        const extension = file.mimetype.split("/")[1];
        const lowercasedName = req.body.username.toLowerCase();
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

router.post("/register", upload.single("avatar"), async (req, res) => {
    const { username, password, fullname } = req.body;
    const users = await Users.findAll();
    const avatar = req.file.filename;

    try {
        const existingUser = await Users.findOne({ where: { username } });
        if (existingUser) {
            return res.status(422).json({
                message: "Username already taken",
            });
        }

        let salt = bcrypt.genSaltSync(10);
        let hash = bcrypt.hashSync(password, salt);

        const newUser = await Users.create({
            username,
            password: hash,
            fullname,
            avatar: req.protocol + "://" + req.get("host") + "/uploads/avatar/" + avatar,
            role: users.length === 0 ? "admin" : "user",
        });

        const userResponse = {
            id: newUser.id,
            username: newUser.username,
            fullname: newUser.fullname,
            avatar: newUser.avatar,
            role: newUser.role,
            updatedAt: newUser.updatedAt,
            createdAt: newUser.createdAt,
        };

        return res.status(201).json(userResponse);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});

router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    Users.findOne({
        where: {
            username: username,
        },
    })
        .then(function (result) {
            if (!result) {
                return res.json({
                    message: "Gagal Login",
                });
            }

            let passwordHash = result.password;
            let checkPassword = bcrypt.compareSync(password, passwordHash);
            if (checkPassword) {
                const token = jwt.sign(
                    { id: result.id, username: result.username, role: result.role },
                    process.env.secret,
                    { algorithm: "HS256", expiresIn: "1h" }
                );
                res.cookie("access_token", token, { httpOnly: true, secure: true });
                res.json({
                    message: "Berhasil Login",
                    token: token,
                });
            } else {
                res.json({
                    message: "Gagal Login",
                });
            }
        })
        .catch(function (error) {
            res.json(error);
        });
});

router.put("/:userId", checkAuth, upload.single("avatar"), async (req, res) => {
    const { userId } = req.params;
    const { username, password, fullname, role } = req.body;

    try {
        const existingUser = await Users.findOne({ where: { username } });
        if (existingUser) {
            return res.status(422).json({
                message: "Username already taken",
            });
        }
        const userToUpdate = await Users.findByPk(userId);
        if (!userToUpdate) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        if (req.authenticatedUser.role !== "admin") {
            return res.status(403).json({
                message: "Access denied. Only admin can update user data.",
            });
        }

        userToUpdate.username = username || userToUpdate.username;
        if (password) {
            let salt = bcrypt.genSaltSync(10);
            let hash = bcrypt.hashSync(password, salt);
            userToUpdate.password = hash;
        }
        userToUpdate.fullname = fullname || userToUpdate.fullname;

        if (req.file) {
            userToUpdate.avatar = req.protocol + "://" + req.get("host") + "/uploads/avatar/" + req.file.filename;
        }

        userToUpdate.role = role || userToUpdate.role;

        const updatedUser = await userToUpdate.save();

        const userResponse = {
            id: updatedUser.id,
            username: updatedUser.username,
            fullname: updatedUser.fullname,
            avatar: updatedUser.avatar,
            role: updatedUser.role,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt,
        };

        return res.status(200).json({
            message: "User data updated successfully",
            ...userResponse,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});



router.delete("/:id", checkAuth, async (req, res) => {
    try {
        const authenticatedUser = req.authenticatedUser;

        if (authenticatedUser.role !== "admin") {
            return res.status(403).json({
                message: "Only admin can delete user",
            });
        }

        const userIdToDelete = req.params.id;
        const userToDelete = await Users.findOne({
            where: {
                id: userIdToDelete,
            },
        });

        if (!userToDelete) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        await userToDelete.destroy();

        return res.status(200).json({
            message: "User deleted successfully",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "An error occurred while deleting the user",
        });
    }
});


router.post("/logout", function (req, res) {
    if (!req.cookies.access_token) {
        return res.status(401).json({
            message: "Unauthorized, please login first!",
        });
    }
    res.clearCookie("access_token");
    res.json({
        message: "Berhasil Logout",
    });
});

module.exports = router;
