// routes/orders.routes.js
const router = require("express").Router();
const Order = require("../models/Order.model");
const Item = require("../models/Item.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");

// Create new order (protected route)
router.post("/", isAuthenticated, async (req, res, next) => {
  try {
    const { items, shippingAddress } = req.body;

    if (!items || !items.length) {
      return res
        .status(400)
        .json({ message: "Order must contain at least one item" });
    }

    if (!shippingAddress) {
      return res.status(400).json({ message: "Shipping address is required" });
    }

    // Calculate total and validate items
    let totalAmount = 0;
    const orderItems = [];

    for (const orderItem of items) {
      // Get item from database to ensure price is correct
      const item = await Item.findById(orderItem.item);

      if (!item) {
        return res
          .status(404)
          .json({ message: `Item with ID ${orderItem.item} not found` });
      }

      if (!item.inStock) {
        return res
          .status(400)
          .json({ message: `Item ${item.name} is out of stock` });
      }

      // Add item to order with correct price from database
      orderItems.push({
        item: item._id,
        quantity: orderItem.quantity || 1,
        price: item.price,
      });

      // Calculate total
      totalAmount += item.price * (orderItem.quantity || 1);
    }

    // Create the order
    const newOrder = await Order.create({
      buyer: req.payload._id, // from JWT middleware
      items: orderItems,
      totalAmount,
      shippingAddress,
      status: "pending",
    });

    // Update items to mark them as sold (out of stock)
    for (const orderItem of orderItems) {
      await Item.findByIdAndUpdate(orderItem.item, { inStock: false });
    }

    res.status(201).json(newOrder);
  } catch (error) {
    next(error);
  }
});

// Get user's orders (protected route)
router.get("/my-orders", isAuthenticated, async (req, res, next) => {
  try {
    const orders = await Order.find({ buyer: req.payload._id })
      .populate("items.item")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// Get order details (protected route)
router.get("/:id", isAuthenticated, async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate("items.item");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Only the buyer can view their order
    if (order.buyer.toString() !== req.payload._id) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this order" });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
});

// Cancel order (protected route)
router.patch("/:id/cancel", isAuthenticated, async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Only the buyer can cancel their order
    if (order.buyer.toString() !== req.payload._id) {
      return res
        .status(403)
        .json({ message: "Not authorized to cancel this order" });
    }

    // Can only cancel if order is still pending or processing
    if (order.status !== "pending" && order.status !== "processing") {
      return res
        .status(400)
        .json({ message: `Cannot cancel order in '${order.status}' status` });
    }

    // Update order status
    order.status = "cancelled";
    await order.save();

    // Make items available again
    for (const orderItem of order.items) {
      await Item.findByIdAndUpdate(orderItem.item, { inStock: true });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
