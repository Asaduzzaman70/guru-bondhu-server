const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// guru_bondhu
// c77YTDFAKrpRASLF

// Middleware
// app.use(cors())
// app.use(cors({
//     credentials: true,
//     origin: ['http://localhost:5173'],
// }))
app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "https://guru-bondhu.web.app",
            "https://guru-bondhu.firebaseapp.com"
        ],
        credentials: true,
    })
);
app.use(express.json());
app.use(cookieParser());


// Verify Token
const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token;
    if (!token) {
        return res.status(401).send({ message: 'not authorized' });
    }
    jwt.verify(token, process.env.SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send('unauthorize');
        }
        req.user = decoded;
        // console.log('I am Decoded',decoded);
        next();
    })
}

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

        // Auth related
        app.post('/jwt', (req, res) => {
            const user = req.body;
            // console.log('user:-', user);
            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            };

            const token = jwt.sign(user, process.env.SECRET, { expiresIn: '1h' });
            // console.log('My Token:-', token);
            res.cookie("token", token, cookieOptions).send({ message: true, token });
        });
        app.post("/logout", async (req, res) => {
            const user = req.body;
            console.log("logging out", user);
            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            };
            res
                .clearCookie("token", { cookieOptions, maxAge: 0 })
                .send({ success: true });
        });



        // Services
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
        app.get('/assignments', verifyToken, async (req, res) => {
            const { diffLevel, _id, userUid } = req.query;
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            const token = req.cookies.token;
            // console.log('Assignment Token Request:-', token);
            // console.log('User Uid', req.user.uId);

            const query = {};
            console.log('Dif Level :-', { page, size });
            if (diffLevel) {
                query.diffLevel = diffLevel;
            }
            if (_id) {
                if (req.user.uId !== userUid) {
                    return res.status(403).send({ message: 'forbidden access' })
                }
                try {
                    query._id = new ObjectId(_id);
                } catch (error) {
                    return res.status(400).send('Invalid _id format');
                }
            }

            // console.log('Uid', query);

            let result;
            if (_id) {
                result = await assignmentsCollection.findOne(query);
            } else {
                result = await assignmentsCollection.find(query)
                    .skip(page * size)
                    .limit(size)
                    .toArray();
            }
            res.send(result);
        })

        // assignments count
        app.get('/assignmentsCount', async (req, res) => {
            const assignmentsCount = await assignmentsCollection.countDocuments();
            res.send({ assignmentsCount });
        })


        app.post('/assignments', async (req, res) => {
            const assignment = req.body;
            // console.log(assignment);
            const result = await assignmentsCollection.insertOne(assignment);
            res.send(result);
        })
        // userUid
        app.delete('/assignments', verifyToken, async (req, res) => {
            const { deleteAssignments } = req.query;
            const userUid = req.query.userUid;
            // console.log('Delete Log: ------->', userUid);

            if (req.user.uId !== userUid) {
                return res.status(403).send({ message: 'forbidden access' })
            }

            const query = { _id: new ObjectId(deleteAssignments) };
            // console.log(query);
            const result = await assignmentsCollection.deleteOne(query);
            res.send(result);
        })

        // update
        app.put('/assignments', verifyToken, async (req, res) => {
            const userUid = req.query.userUid;
            if (req.user.uId !== userUid) {
                return res.status(403).send({ message: 'forbidden access' })
            }

            const id = req.query._id;
            const assignmentData = req.body.formData;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };

            // console.log('Update', assignmentData);

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
        app.get('/submitDoc', verifyToken, async (req, res) => {
            const { userUid, statusPending, userUid2 } = req.query;

            const token = req.cookies.token;
            // console.log('Assignment Token Request:-', token);
            // console.log('User Uid', req.user.uId);


            const query = {};
            // console.log("Status", statusPending, userUid);
            if (userUid) {
                if (req.user.uId !== userUid) {
                    return res.status(403).send({ message: 'forbidden access' })
                }
                try {
                    query.userId = userUid;
                } catch (error) {
                    return res.status(400).send('Invalid _id format');
                }
            }
            if (statusPending) {
                if (req.user.uId !== userUid2) {
                    return res.status(403).send({ message: 'forbidden access' })
                }
                query.status = 'Pending';
            }
            // console.log('Here is', query, userUid);

            let result;
            result = await submittedAssignmentsCollection.find(query).toArray();
            res.send(result);
        })
        app.post('/submitDoc', async (req, res) => {
            const submitDoc = req.body;
            const { attemptId, userId } = req.query;

            if (!attemptId || !userId) {
                return res.status(400).send({ error: 'AttemptId and userId are required' });
            }



            try {
                // Check if the user has already submitted this assignment
                const existingSubmission = await submittedAssignmentsCollection.findOne({ attemptId, userId });

                if (existingSubmission) {
                    if (existingSubmission.status === 'Pending') {
                        return res.status(400).send({ error: 'User has a pending submission and cannot resubmit until it is complete.' });
                    } else if (existingSubmission.status === 'Complete') {
                        // Allow resubmission if status is complete
                        const result = await submittedAssignmentsCollection.updateOne(
                            { attemptId, userId },
                            { $set: { ...submitDoc, status: 'Pending' } }
                        );
                        return res.status(200).send(result);
                    }
                } else {
                    // If no existing submission, insert the new submission
                    const result = await submittedAssignmentsCollection.insertOne({ ...submitDoc, attemptId, userId, status: 'Pending' });
                    return res.status(200).send(result);
                }

            } catch (error) {
                console.error('Error submitting assignment:', error);
                res.status(500).send({ error: 'An error occurred while submitting the assignment. Please try again.' });
            }

            // const result = await submittedAssignmentsCollection.insertOne(submitDoc);
            // res.send(result);
        })
        app.put('/submitDoc', async (req, res) => {
            const submitAssignmentData = req.body;
            const { attemptId, userId } = req.query;

            // console.log(submitAssignmentData);

            if (!attemptId || !userId) {
                return res.status(400).send({ error: 'AttemptId and userId are required' });
            }

            try {
                // Check if the user has already submitted this assignment
                const existingSubmission = await submittedAssignmentsCollection.findOne({ attemptId, userId });

                if (existingSubmission) {
                    if (existingSubmission.status === 'Pending') {
                        // Allow resubmission if status is complete
                        const result = await submittedAssignmentsCollection.updateOne(
                            { attemptId, userId },
                            { $set: { ...submitAssignmentData, status: 'Complete' } }
                        );
                        return res.status(200).send(result);
                    } else if (existingSubmission.status === 'Complete') {
                        return res.status(400).send({ error: 'User has a complete submission and cannot resubmit until it is pending.' });
                    }
                } else {
                    // If no existing submission, insert the new submission
                    const result = await submittedAssignmentsCollection.insertOne({ ...submitDoc, attemptId, userId, status: 'Pending' });
                    return res.status(200).send(result);
                }

            } catch (error) {
                console.error('Error submitting assignment:', error);
                res.status(500).send({ error: 'An error occurred while submitting the assignment. Please try again.' });
            }

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