process.env.NODE_ENV === "test"

const request = require('supertest');
const app = require('../app');
const db = require('../db');
const slugify = require('slugify');

let testCompanies;
beforeEach(async () => {
    const results = await db.query(
        `INSERT INTO companies (code, name, description)
        VALUES ('apple', 'apple mac', 'apple laptop') 
        RETURNING code, name, description `);
        testCompanies = results.rows[0]
});

afterEach(async ()=> {
    await db.query(`DELETE FROM companies`)
});

afterAll(async () =>{
    await db.end()
});

describe("GET /companies", () => {
    test("Get a list of companies", async () => {
        const res = await request(app).get('/companies');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ companies: [testCompanies] });
    });
});

// describe("GET /companies/[code]", () => {
//     test("Get a list from one company", async () => {
//         const res = await request(app).get('/companies');
//         expect(res.statusCode).toBe(200);
//         expect(res.query).toEqual({companies:[]});
//     })
// })

describe("POST /companies", () => {
    test("Creates a single company", async () => {
        const companyData = {
            name:'iphone',
            description: 'cellphone'
        }
        const companyCode = slugify(companyData.name,{lower:true});
        const res = await request(app).post('/companies')
        .send({name:'iphone', description:'cellphone'});
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({
            company:{
                code:companyCode,
                name:companyData.name,
                description:companyData.description
            }
        });
        
    });
});

describe("PATCH /companies/:code", () => {
    test('Edit a company', async () => {
        const res = await request(app).patch(`/companies/${testCompanies.code}`)
        .send({name:'apple pen', description: testCompanies.description});
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            company:{
                code: testCompanies.code,
                name:"apple pen",
                description: testCompanies.description
            }
        });
    });
    test('Responds with 404 if cannot be found', async () => {
        const response = await request(app).patch(`/companies/andriod`);
        expect(response.statusCode).toEqual(404);
    });
});

describe("DELETE /companies/:code", () => {
    test("Deletes a company", async () => {
        const res = await request(app).delete(`/companies/${testCompanies.code}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({status:"Deleted"});
    });
    
})