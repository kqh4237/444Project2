const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/orders
router.get("/", async (req, res) =>{
    try {
        const [rows] = await db.query("SELECT * FROM orders");
        res.json(rows);
    } catch (err){
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// GET /api/orders/id
router.get("/:id", async (req, res) =>{
    try {
        const [orderRows] = await db.query(
            "SELECT * FROM orders WHERE id = ?",
            [req.params.id]
        );

        if (orderRows.length === 0){
            return res.status(404).json({ error: "Order not found" });
        }

        const [itemRows] = await db.query(
            `SELECT
              oi.order_id,
              oi.menu_item_id,
              oi.quantity,
              mi.name,
              mi.price
            FROM order_items oi
            JOIN menu_items mi ON oi.menu_item_id = mi.id
            WHERE oi.order_id = ?`,
            [req.params.id]
        );

        res.json({
            ...orderRows[0],
            items: itemRows,
        })
    } catch (err){
        console.error(err);
        res.status(500).json({ error: "Database error"});
    }
});

// POST /api/orders
router.post("/", async (req,res) => {
    const connection = await db.getConnection();

    try {
        const { customer_name, notes, items} = req.body;

        await connection.beginTransaction();

        let total_price = 0;

        for (const item of items) {
            const [menuRows] = await connection.query(
                "SELECT price FROM menu_items WHERE id = ?",
                [item.menu_item_id]
            );

            if (menuRows.length === 0) {
                throw new Error(`Menu item ${item.menu_item_id} not found`)
            }

            total_price += Number(menuRows[0].price) * item.quantity;
        }

        const [orderResult] = await connection.query(
            `INSERT INTO orders
            (customer_name, status, total_price, notes)
            VALUES (?, ?, ?, ?)`,
            [customer_name, "pending", total_price, notes || null]
        );

        const orderId = orderResult.insertId;

        for (const item of items) {
            await connection.query(
                `INSERT INTO order_items
                (order_id, menu_item_id, quantity)
                VALUES (?, ?, ?)`,
                [orderId, item.menu_item_id, item.quantity]
            );
        }

        await connection.commit();

        res.status(201).json({
            message: "Order created",
            order_id: orderId,
            total_price,
        });
    } catch (err){
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release()
    }
});

// PUT /api/orders/id update an existing order
router.put("/:id", async (req, res) => {
    try{
        const { customer_name, status, total_price, notes } = req.body;

        const [result] = await db.query(
            `UPDATE orders
            SET customer_name = ?, status = ?, total_price = ?, notes = ?
            WHERE id = ?`,
            [customer_name, status, total_price, notes, req.params.id]
        );

        if (result.affectedRows === 0){
            return res.status(404).json({ error: "Order not found" });
        }

        res.json({ message: "Order updated" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error"});
    }
});

// DELETE /api/orders/id delete an existing order
router.delete("/:id", async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        await connection.query(
            "DELETE FROM order_items WHERE order_id = ?",
            [req.params.id]
        );

        const [result] = await connection.query(
            "DELETE FROM orders WHERE id = ?",
            [req.params.id]
        );

        if (result.affectedRows === 0){
            await connection.rollback();
            return res.status(404).json({ error: "Order not found" });
        }

        await connection.commit();

        res.json({ message: "Order deleted" });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: "Database error" });
    } finally {
        connection.release();
    }
});
module.exports = router;