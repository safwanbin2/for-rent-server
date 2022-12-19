const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mogpxeu.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
// verifying jwt
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(403).send({ message: "unauthorized access" })
    }
    const authToken = authHeader.split(' ')[1];
    jwt.verify(authToken, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: "unauthorized access" })
        }
        req.decoded = decoded;
        next();
    })
}

function run() {
    try {
        client.connect();
        console.log("mongo db connected successfully");
    } catch (error) {
        console.log('failed to connect')
    }
}
run();

const UsersCollection = client.db('ForRent').collection('users');
const CarsCollection = client.db('ForRent').collection('cars');
const BookingCollection = client.db('ForRent').collection('bookings')

app.get('/', (req, res) => {
    res.send("for-rent server is running");
})
// saving user
app.post('/users', async (req, res) => {
    try {
        const user = req.body;
        const filter = { email: user.email };
        const exist = await UsersCollection.findOne(filter);
        if (exist) {
            return res.send({ message: "Account already saved in DB" })
        }
        const result = await UsersCollection.insertOne(user);
        res.send(result)
    } catch (error) {
        console.log(error)
    }
})
// getting jwt token
app.get('/jwt', async (req, res) => {
    try {
        const email = req.query.email;
        const token = jwt.sign(email, process.env.JWT_SECRET);
        res.send({ token })
    } catch (error) {
        console.log(error)
    }
})
// adding new car
app.post('/allcars', verifyJWT, async (req, res) => {
    try {
        const newCar = req.body;
        const result = await CarsCollection.insertOne(newCar);
        res.send(result);
    } catch (error) {
        console.log(error)
    }
})
// getting all the cars
app.get('/allcars', async (req, res) => {
    try {
        const filter = {};
        const result = await CarsCollection.find(filter).toArray();
        res.send(result)
    } catch (error) {
        console.log(error)
    }
})
// getting specific car by id
app.get('/car/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const filter = { _id: ObjectId(id) };
        const result = await CarsCollection.findOne(filter);
        res.send(result)
    } catch (error) {
        console.log(error)
    }
})
// deleteing specific car
app.delete('/allcars', verifyJWT, async (req, res) => {
    try {
        const id = req.query.id;
        const filter = { _id: ObjectId(id) };
        const result = await CarsCollection.deleteOne(filter);
        res.send(result);
    } catch (error) {
        console.log(error)
    }
})
// posting all the bookings 
app.post('/bookings', async (req, res) => {
    try {
        const newBooking = req.body;
        const result = await BookingCollection.insertOne(newBooking);
        res.send(result);
    } catch (error) {
        console.log(error)
    }
})
// updating approve status
app.put('/bookings/approve/:id', verifyJWT, async (req, res) => {
    try {
        const id = req.params.id;
        const filter = { _id: ObjectId(id) };
        const updatedDoc = {
            $set: {
                isApproved: true
            }
        };
        const result = await BookingCollection.updateOne(filter, updatedDoc, { upsert: true });
        res.send(result);
    } catch (error) {
        console.log(error)
    }
})
// getting certain dated bookings
app.get('/bookings/:date', verifyJWT, async (req, res) => {
    try {
        const date = req.params.date;
        const filter = { bookingDate: date };
        const result = await BookingCollection.find(filter).toArray();
        res.send(result);
    } catch (error) {
        console.log(error)
    }
})
// getting email sepcific bookings
app.get('/bookings', verifyJWT, async (req, res) => {
    try {
        const email = req.query.email;
        const filter = { buyerEmail: email };
        const result = await BookingCollection.find(filter).toArray();
        res.send(result);
    } catch (error) {
        console.log(error)
    }
})








app.listen(port, () => console.log(`for-rent server is running on ${port}`))