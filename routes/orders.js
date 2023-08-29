const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/auth");
const { Orders, Products } = require("../models");
const { response, responseWithData } = require("../middleware/response");

router.post("/process", checkAuth, async (req, res) => {
  try {
    const userId = req.authenticatedUser.id;
    const { orderId } = req.body; 

    const orders = await Orders.findAll({
      where: { userId, id: orderId },
      include: [Products],
    });

    if (orders.length === 0) {
      return res.status(404).json({ message: "Orders not found" });
    }

    for (const order of orders) {
      const product = order.Product;
      const newStock = product.stock - order.amount;
      if (newStock < 0) {
        return res.status(400).json({ message: "Insufficient stock" });
      }
      const processed = await Products.update({ stock: newStock }, { where: { id: product.id } });
      await Orders.destroy({ where: { id: order.id } });
      return res.status(200).json(responseWithData(200, processed, "Successfully process order"));
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error });
  }
});

router.post("/:productId", checkAuth, async (req, res) => {
  try {
    const productId = req.params.productId;
    const amount = req.body.amount;
    const userId = req.authenticatedUser.id

    const product = await Products.findByPk(productId);
    if (!product) {
      return res.status(404).json(response(404, "Product not found"));
    }

    if (product.stock < amount) {
      return res.status(400).json(response(400, "Out of stock"));
    }
    const order = await Orders.create({
      userId,
      productId: parseInt(productId),
      amount: parseInt(amount),
    });

    const orderResponse = {
      orderId: order.id,
      productId: product.id,
      productName: product.name,
      productPicture: product.picture,
      productPrice: product.price,
      amount: order.amount,
      totalPrice: product.price * order.amount,
    };

    await product.save();
    return res.status(201).json(responseWithData(201, orderResponse, "Successfully create order"));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error });
  }
});

router.get("/my", checkAuth, async (req, res) => {
  try {
    const userId = req.authenticatedUser.id;
    const orders = await Orders.findAll({
      where: { userId },
      include: [
        {
          model: Products,
          attributes: ["id", "name", "picture", "price"],
        },
      ],
    });

    if (orders.length === 0) {
      return res.status(404).json(response(404, "Order not found"));
    }

    const orderDetails = orders.map((order) => {
      return {
        orderId: order.id,
        productId: order.Product.id,
        productName: order.Product.name,
        productPicture: order.Product.picture,
        productPrice: order.Product.price,
        amount: order.amount,
        totalPrice: order.Product.price * order.amount,
      };
    });

    return res.status(200).json(responseWithData(200, orderDetails, "Successfully get order list"));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error });
  }
});

router.delete("/:orderId", checkAuth, async (req, res) => {
  const { orderId } = req.params;
  const userId = req.authenticatedUser.id;
  try {
    const order = await Orders.findByPk(orderId, {
      where: { userId },
      include: [Products],
    });
    if (!order) {
      return res.status(404).json(response(404, "Order not found"));
    }
    if (order.userId !== req.authenticatedUser.id) {
      return res.status(403).json(response(403, "You are not owner of this order"));
    }

    const product = order.Product;
    product.stock += order.amount;
    await product.save();
    await order.destroy();
    return res.status(200).json(responseWithData(200, "Successfully delete order"));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error });
  }
});

module.exports = router;
