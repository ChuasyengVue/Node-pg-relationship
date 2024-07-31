process.env.NODE_ENV === "test"

const request = require('supertest');
const app = require('../app');
const db = require('../db');
const slugify = require('slugify');

let testInvoices;
beforeEach(async () => {
    // Make sure the referenced company exists
    await db.query(
        `INSERT INTO companies (code, name, description) 
         VALUES ('microsoft', 'Microsoft Corp.', 'Tech company') 
         ON CONFLICT (code) DO NOTHING` // Avoid inserting duplicate data
    );

    const results = await db.query(
        `INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date)
         VALUES ('microsoft', 100, false, '2024-07-30', null) 
         RETURNING id, comp_code, amt, paid, add_date, paid_date`
    );
    // const results2 = await db.query(
    //     `INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date)
    //      VALUES ('microsoft', 200, true, '2024-08-31', '2024-08-31') 
    //      RETURNING id, comp_code, amt, paid, add_date, paid_date`
    // );
    const row = results.rows[0];

    // Normalize dates to ISO strings for consistency
    testInvoices = {
        ...row,
        add_date: new Date(row.add_date).toISOString(),
        paid_date: row.paid_date ? new Date(row.paid_date).toISOString() : null
    };
});

afterEach(async ()=> {
    await db.query(`DELETE FROM invoices`)
});

afterAll(async () =>{
    await db.end()
});



describe("GET /invoices", () => {
    test('Gets list of invoices', async() =>{
        const res = await request(app).get('/invoices');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({invoices:[testInvoices]});
    });
});

describe("POST /invoices", () => {
    test('Create a new invoice', async ()=> {
        const res = await request(app).post(`/invoices`).send({
            comp_code: 'apple',
            amt: 200,
            paid: true,
            add_date: '2024-07-30',
            paid_date: '2024-07-30'  
        });
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({
            invoices: {
                id:expect.any(Number),
                comp_code: 'apple',
                amt: 200,
                paid: true,
                add_date: '2024-07-30',
                paid_date: '2024-07-30' 
            }
        });
    });
});