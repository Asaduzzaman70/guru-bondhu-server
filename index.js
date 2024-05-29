const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// guru_bondhu
// c77YTDFAKrpRASLF

// Middleware
app.use(cors())
app.use(express.json())


// Express Js Connected Code
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASSWORD}@cluster0.z51z0nl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        // Start
        const userCollection = client.db('GuruDoctor').collection('user');
        const faq_infoCollection = client.db('GuruDoctor').collection('faq_info');

        // Set User
        app.get('/users', async (req, res) => {
            const user = userCollection.find();
            const result = await user.toArray();
            res.send(result);
        })
        app.post('/users', async(req, res) =>{
            const user = req.body;
            console.log(user);
            const result = await userCollection.insertOne(user);
            res.send(result);
        })

        // FAQ Info
        app.get('/faq_info', async(req, res) =>{
            const faq = faq_infoCollection.find();
            const result = await faq.toArray();
            res.send(result);
        })

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Guru Bondhu Is Running................')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})