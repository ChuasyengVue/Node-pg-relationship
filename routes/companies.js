const express = require('express');
const slugify = require('slugify');
const router = new express.Router();
const db = require('../db')
const ExpressError = require('../expressError');

// Gets the list of companies
router.get('/', async (req, res, next) => {
    try {
        const results = await db.query('SELECT * FROM companies');
        return res.json({companies: results.rows});
    } 
    catch (error) {
        return next(error);
    }
});

// Gets a list of a specific company
router.get('/:code', async (req, res, next) => {
    try {
        const {code} = req.params;
        
        const results = await db.query(`SELECT * FROM companies WHERE code=$1`, [code]);
        const company = results.rows[0];

        if(!company){
            throw new ExpressError(`Company cannot be found`, 404);
        }

        const industryResults = await db.query(
            `SELECT i.code, i.industry 
            FROM industries i
            JOIN industries_companies ic ON i.code = ic.industry_code
            WHERE ic.company_code = $1`, [code]);

        console.log(`Industry results: ${JSON.stringify(industryResults.rows)}`);

        return res.json({company:company, industries:industryResults.rows});
    } 
    catch (error) {
        return next(error);
    }
});


// Adds a new company
router.post('/', async (req, res, next) => {
    try {
        const {name, description} = req.body;
        const code = slugify(name, {lower:true});
        const results = await db.query(`INSERT INTO companies (code, name, description)
             VALUES ($1, $2, $3) RETURNING code, name, description`, [code, name, description]);
        return res.status(201).json({company: results.rows[0]});
    } 
    catch (error) {
        return next(error);
    }
});


// Associating an industry to company
// /companies/:code/industries/:industryCode
router.post('/:code/industries/:industryCode', async (req, res, next) => {
    try {
        const {code} = req.params;
        const {industryCode} = req.params;

        const companyResults = await db.query(
            `SELECT code FROM companies WHERE code =$1
            `, [code]);
        
        if(!companyResults.rows.length){
            throw new ExpressError('Company not found', 404);
        }

        const industryResults = await db.query(
            `SELECT code FROM industries WHERE code =$1`,
            [industryCode]
        );

        if(!industryResults.rows.length){
            throw new ExpressError('Company not found',404);
        }

        const results = await db.query(`INSERT INTO industries_companies (company_code, industry_code)
            VALUES ($1,$2)
            ON CONFLICT (company_code, industry_code) DO NOTHING 
            RETURNING company_code, industry_code`,
        [code, industryCode]);

        return res.status(201).json({industry: results.rows[0]});

    } catch (error) {
        return next(error);
    }
})



// Edit an existing company
router.patch('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const { name, description} = req.body;

        const results = await db.query(`UPDATE companies SET name=$1, description=$2
             WHERE code=$3 RETURNING code, name, description`,[name, description, code]);
        if(results.rows.length === 0){
            throw new ExpressError('Company cannot be found', 404);
        }    
        return res.status(200).json({company: results.rows[0]});
    }
     catch (error) {
        return next(error);
    }
});


// Delete a company
router.delete('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;

        const results = await db.query(`DELETE FROM companies WHERE code=$1`, [code]);
        return res.status(200).json({status:"Deleted"});
    } 
    catch (error) {
        return next(error);
    }
});


module.exports = router;