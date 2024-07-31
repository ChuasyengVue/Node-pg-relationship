const express = require('express');
const router = new express.Router();
const db = require('../db')



// Get list for all industries
router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(
            `SELECT i.code, i.industry, ARRAY_AGG(c.code) AS company_codes
            FROM industries i
            LEFT JOIN industries_companies ic ON i.code = ic.industry_code
            LEFT JOIN companies c ON ic.company_code = c.code
            GROUP BY i.code, i.industry`);
        return res.status(200).json({industry: results.rows});
    } catch (error) {
        return next(error);
    }
})

// Add a new industry
router.post('/', async (req, res, next) => {
    try {
        const {code, industry} = req.body;

        const results = await db.query(
            `INSERT INTO industries (code, industry)
            VALUES ($1, $2) RETURNING code, industry`,
            [code, industry]);
        return res.status(201).json({industry: results.rows[0]});
    } catch (error) {
        return next(error);
    }
});





module.exports = router;