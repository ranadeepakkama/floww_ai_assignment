const express = require('express');
const cors = require('cors'); 
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');


let database = null;
const databasePath = path.join(__dirname, 'personalExpenseTracker.db');
const app = express();
app.use(express.json());


const createTable = async () => {
    await database.exec(`
        CREATE TABLE IF NOT EXISTS "transaction" (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            income INTEGER,
            type VARCHAR(255) CHECK(type IN ('income', 'expense')) NOT NULL,
            category VARCHAR(255) NOT NULL,
            amount INTEGER,
            date DATE,
            description TEXT
        )
    `);
    
    await database.exec(`
        CREATE TABLE IF NOT EXISTS "categories" (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(255) NOT NULL, 
            type VARCHAR(255) CHECK(type IN ('income', 'expense')) NOT NULL
        )
    `);
    
    console.log('Tables are created');
};


const initializeDbAndServer = async () => {
    try {
        database = await open({
            filename: databasePath,
            driver: sqlite3.Database
        });

        createTable();

        app.use(cors({
            origin: 'http://localhost:3000' 
        }));

        app.get('/api', (req, res) => {
            res.json({ 'userName': ['test1', 'test2', 'test3'] });
        });

        app.listen(4000, () =>
            console.log('Server Running at http://localhost:4000')
        );
    } catch (e) {
        console.log(`DB Error: ${e.message}`);
        process.exit(1);
    }
};

initializeDbAndServer();

app.post('/post', async (req, res) => {
    const {income,type,category,amount,date,description} = req.body;
    
    const getTransactionQuery = `INSERT INTO transaction (income,type,category,amount,date,description) VALUES (?,?,?,?,?,?)`;
    const result = await database.run(getTransactionQuery,[income,type,category,amount,date,description]) 
    console.log('new data is registered');
})


