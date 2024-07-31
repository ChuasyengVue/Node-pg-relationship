const express = require('express');
const router = new express.Router();
const db = require('../db');
const ExpressError = require('../expressError');


// Get list of invoices
router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT * FROM invoices`);
        return res.json({invoices: results.rows});
    }
     catch (error) {
        return next(error);
    }
});


// Get invoice base on id
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const results = await  db.query(`SELECT * FROM invoices WHERE id=$1`,[id]);
        if(results.rows.length === 0){
            throw new ExpressError('Invoice cannot be found', 404);
        }
        return res.json({invoices: results.rows[0]});
    } 
    catch (error) {
        return next(error);
    }
});


// Creates an invoice 
router.post('/', async (req, res, next) => {
    try {
        
        const { comp_code, amt, paid, add_date, paid_date } = req.body;

        const results = await db.query(`INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date) 
            VALUES ($1, $2, $3, $4, $5) RETURNING id, comp_code, amt, paid, add_date, paid_date `,
        [comp_code, amt, paid, add_date, paid_date]);
        return res.json({invoice: results.rows[0]});
    } 
    catch (error) {
        return next(error);    
    }
});


// Updates an invoice
router.patch('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const {  amt, paid } = req.body;

        if(typeof amt !== 'number' || typeof paid !== 'boolean'){
            throw new ExpressError(`Invalid request `, 400);
        }
        const results = await db.query(`SELECT * FROM invoices WHERE id = $1`, [id]);
            
        const currentInvoice = results.rows[0];

        if (!currentInvoice) {
            throw new ExpressError(`Invoice not found`, 404)
        }

        let paid_date = null;
        // set current date
        if(paid && !currentInvoice.paid){
            paid_date = new Date().toISOString()
        }
        // set unpaid date
        else if(!paid && currentInvoice.paid){
            paid_date = null;
        }
        // no changes to paid_date
        else{
            paid_date = currentInvoice.paid_date;
        }

        // Update the invoice
        const updateResult = await db.query(
            `UPDATE invoices
             SET amt = $1, paid = $2, paid_date = $3
             WHERE id = $4
             RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [amt, paid, paid_date, id]
        );

        const updatedInvoice = updateResult.rows[0];

        return res.json({ invoice: updatedInvoice });

    } 
    catch (error) {
        return next(error);
    }
});


// Deletes an invoice
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const results = await db.query(`DELETE FROM invoices WHERE id=$1`,[id]);
        if(results.rows.length === 0){
            throw new ExpressError('Invoice cannot be found', 404);
        }
        return res.json({status:"DELETED!"});
    } catch (error) {
        return next(error);
    }
});


// Get company objectives
router.get('/:code', async (req, res, next) => {
    try {
        const {id} = req.params;

        const results = await db.query(`SELECT i.id, i.comp_code, i.amt, i.paid, i.add_date, i.paid_date, c.name, c.description
            FROM invoices AS i INNER JOIN companies AS c ON (i.comp_code = c.code)
            WHERE id =$1`, [id]);
            if(results.rows.length === 0 ){
                throw new ExpressError(`There is no invoice: ${id}`, 404);
            }
        const data = results.rows[0];
        const invoice = {
            id: data.id,
            company:{
                code: data.comp_code,
                name: data.name,
                description: data.description,
            },
            amt: data.amt,
            paid: data.paid,
            add_data: data.add_data,
            paid_data: data.paid_data,
        };
        return res.json({company: invoice});
    } 
    catch (error) {
        return next(error);
    }
})






module.exports = router;