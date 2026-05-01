const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/menu
router.get("/", async (req, res) =>{
    try {
        const [rows] = await db.query("SELECT * FROM menu_items");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// GET /api/menu/id
router.get("/:id", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM menu_items WHERE id = ?",
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Menu item not found" });
        }

        res.json(rows[0]);
    } catch (err){
        console.error(err);
        res.status(500).json({ error: "Database error"});
    }
});

// POST /api/menu
router.post("/", async (req, res) => {
    try {
        const { name, category, description, price, available } = req.body;

        const [result] = await db.query(
            `INSERT INTO menu_items
            (name, category, description, price, available)
            VALUES (?, ?, ?, ?, ?)`,
            [name, category, description, price, available ?? 1]
        );

        res.status(201).json({
            id: result.insertId,
            name,
            category,
            description,
            price,
            avilable: available ?? 1,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// PUT /api/menu/id update a menu item
router.put("/:id", async (req, res) => {
    try {
        const { name, category, description, price, available } = req.body;

        const [result] = await db.query(
            `UPDATE menu_items
            SET name = ?, category = ?, description = ?, price = ?, available = ?
            WHERE id = ?`,
            [name, category, description, price, available, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Menu item not found" });
        }

        res.json({ message: "Menu item updated"});
    } catch (err){
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// DELETE /api/menu/id delete a menu item
router.delete("/:id", async (req,res) => {
    try {
        const [result] = await db.query(
            "DELETE FROM menu_items WHERE id = ?",
            [req.params.id]
        );

        if (result.affectedRows === 0){
            return res.status(404).json({ error: "Menu item not found" });
        }

        res.json({ message: "Menu item deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});


module.exports = router;