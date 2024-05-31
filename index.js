const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const assignmentsCollection = client.db('GuruDoctor').collection('assignments');
        const submittedAssignmentsCollection = client.db('GuruDoctor').collection('submittedAssignments');

        // Set User
        app.get('/users', async (req, res) => {
            const user = userCollection.find();
            const result = await user.toArray();
            res.send(result);
        })
        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await userCollection.insertOne(user);
            res.send(result);
        })

        // FAQ Info
        app.get('/faq_info', async (req, res) => {
            const faq = faq_infoCollection.find();
            const result = await faq.toArray();
            res.send(result);
        })

        // Create Assignment
        app.get('/assignments', async (req, res) => {
            const { diffLevel, _id } = req.query;
            const query = {};

            if (diffLevel) {
                query.diffLevel = diffLevel;
            }
            if (_id) {
                try {
                    query._id = new ObjectId(_id);
                } catch (error) {
                    return res.status(400).send('Invalid _id format');
                }
            }

            console.log('Uid', query);

            let result;
            if (_id) {
                result = await assignmentsCollection.findOne(query);
            } else {
                result = await assignmentsCollection.find(query).toArray();
            }
            res.send(result);
        })


        app.post('/assignments', async (req, res) => {
            const assignment = req.body;
            // console.log(assignment);
            const result = await assignmentsCollection.insertOne(assignment);
            res.send(result);
        })
        app.delete('/assignments', async (req, res) => {
            const { deleteAssignments } = req.query;
            const query = { _id: new ObjectId(deleteAssignments) };
            // console.log(query);
            const result = await assignmentsCollection.deleteOne(query);
            res.send(result);
        })

        // update
        app.put('/assignments', async (req, res) => {
            const id = req.query._id;
            const assignmentData = req.body.formData;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };

            console.log('Update', assignmentData);

            const newAssignment = {
                $set: {
                    title: assignmentData.title,
                    description: assignmentData.description,
                    marks: assignmentData.marks,
                    diffLevel: assignmentData.diffLevel,
                    dueDate: assignmentData.dueDate,
                    photoUrl: assignmentData.photoUrl
                }
            }

            const result = await assignmentsCollection.updateOne(filter, newAssignment, options);
            res.send(result);
        })

        // Submitted Assignments
        app.get('/submitDoc', async (req, res) => {
            const submitDoc = submittedAssignmentsCollection.find();
            const result = await submitDoc.toArray();
            res.send(result);
        })
        app.post('/submitDoc', async (req, res) => {
            const submitDoc = req.body;
            const { attemptId, userId } = req.query;
            
            if (!attemptId || !userId) {
                return res.status(400).send({ error: 'AttemptId and userId are required' });
            }

            try{
                const exitingSubmission = await submittedAssignmentsCollection.findOne({attemptId, userId});
                if (exitingSubmission) {
                    return res.status(400).send({ error: 'User has already submitted this assignment.' });
                }

                const result = await submittedAssignmentsCollection.insertOne(submitDoc);
                res.status(200).send(result);
            }catch (error) {
                console.error('Error submitting assignment:', error);
                res.status(500).send({ error: 'An error occurred while submitting the assignment. Please try again.' });
            }

            // const result = await submittedAssignmentsCollection.insertOne(submitDoc);
            // res.send(result);
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