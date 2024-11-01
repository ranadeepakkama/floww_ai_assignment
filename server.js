const express = require('express');
const cors = require('cors');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');
const { error } = require('console');

let db = null;
const databasePath = path.join(__dirname, 'ExpenseTracker.db');
const app = express();
app.use(express.json());


// create new database
const createTable = async () => {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS "transactions" (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type VARCHAR(255) CHECK(type IN ('income', 'expense')) NOT NULL,
            category VARCHAR(255) NOT NULL,
            amount INTEGER,
            date DATE,
            description TEXT
        )
    `);

    await db.exec(`
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
        db = await open({
            filename: databasePath,
            driver: sqlite3.Database,
        });

        await createTable();

        app.use(
            cors({
                origin: 'http://localhost:3000',
            })
        );

        app.get('/api', (req, res) => {
            res.json({ userName: ['test1', 'test2', 'test3'] });
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


// Adds a new transaction (income or expense).

app.post('/post', async (req, res) => {
    const { type, category, amount, date, description } = req.body;

    try {
        const insertTransactionQuery = `
            INSERT INTO transactions (type, category, amount, date, description)
            VALUES (?, ?, ?, ?, ?)
        `;
        const result = await db.run(insertTransactionQuery, [
            type,
            category,
            amount,
            date,
            description,
        ]);

        console.log('New data is registered', result);
        res.status(201).json({ message: result });

    } catch (error) {
        console.error('Error inserting data:', error.message);
        res.status(500).json({ error: 'Failed to add transaction' });
    }
});


// Retrieves all transactions. 
app.get('/get', async (req, res) => {
    try {
        const getAllData = `SELECT * FROM transactions`;
        const result = await db.all(getAllData);
        res.status(200).json({ transactions: result });
        console.log(result);
    }    
    catch (error) {
        console.log('Error retrieving data:', error.message);
        res.status(500).json({ error: 'Failed to retrieve transactions' });
    }
});

app.delete('/delete/:id', async (req, res) => {
    try{
        const deleteQuery = `DELETE FROM transactions WHERE ID = ?`; 
        const result = await db.run(deleteQuery,[req.params.id]);
        res.status(200).json({message: "data is deleted successfully"})
        console.log('data is deleted') 
    } catch(err){
        console.log('Error retrieving data:', error.message);
        res.status(500).json({ error: 'Failed to retrieve transactions' });
    }
});

//Retrieves a transaction by ID

app.get('/retrieve/:id', async (req, res) => {
    try {
        const getSelectedId = `SELECT * FROM transactions WHERE id = ?`;
        const result = await db.get(getSelectedId, [req.params.id]);
        
        if (result) {
            console.log(result);
            res.status(200).json(result);
        } else {
            res.status(404).json({ error: 'Transaction not found' });
        }
    } catch (err) {
        console.log('Error retrieving data:', err.message);
        res.status(500).json({ error: 'Failed to retrieve transaction' });
    }
});

app.put('/update/:id', async (req,res) => {
    try{
        const upateQuery = `UPDATE transactions SET type = 'income' WHERE id = ?
        `
        const result = await db.run(upateQuery,[req.params.id]);
        res.status(200).json({ result: 'updated successfully'});
        console.log('updated successfully')
    } catch (err) {
        res.status(500).json({message: err.message});
        console.log('Error retrieving data:', err.message);
    }
})

app.get('/summary', async (req, res) => {
    try {
        const summaryQuery = `
            SELECT 
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense,
                (SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) - SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END)) as balance
            FROM transactions
            GROUP BY category
        `;
        const result = await db.get(summaryQuery);
        res.status(200).json({ message: result });
        console.log('Success retrieving data:', result);
    } catch (err) {
        res.status(500).json({ message: err.message });
        console.log('Error retrieving data:', err.message);
    }
});

