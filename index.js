const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.Port || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@ahserver.lso3nfx.mongodb.net/?appName=AHServer`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get("/", (req, res) => {
  res.send("Hero Home Server Running");
});

async function run() {
  try {
    await client.connect();

    const db = client.db("home_db");
    const serviceCollection = db.collection("services");
    const bookingCollection = db.collection("bookings");

    app.get("/services", async (req, res) => {
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/bookings", async (req, res) => {
      const cursor = bookingCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await serviceCollection.findOne(query);
      res.send(result);
    });

    app.get("/latest-services", async (req, res) => {
      const cursor = serviceCollection.find().sort({ createdAt: 1 }).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/services", async (req, res) => {
      const newService = req.body;
      const result = await serviceCollection.insertOne(newService);
      res.send(result);
    });

    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const serviceIdString = booking.serviceId;
      let serviceObjectId;
      try {
        serviceObjectId = new ObjectId(serviceIdString);
      } catch (e) {
        console.error("Invalid serviceId format:", serviceIdString);
        return res
          .status(400)
          .send({ message: "Invalid service ID provided." });
      }
      const bookingToInsert = {
        ...booking,
        serviceId: serviceObjectId,
        createdAt: new Date(),
      };
      delete bookingToInsert.serviceIdString;
      const result = await bookingCollection.insertOne(bookingToInsert);
      res.status(201).send(result);
    });

    app.patch("/services/:id", async (req, res) => {
      const id = req.params.id;
      const updateService = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: updateService,
      };
      const result = await serviceCollection.updateOne(query, update);
      res.send(result);
    });

    app.delete("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await serviceCollection.deleteOne(query);
      res.send(result);
    });

    app.delete("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      let bookingObjectId;
      try {
        bookingObjectId = new ObjectId(id);
      } catch (e) {
        return res.status(400).send({ message: "Invalid booking ID format." });
      }
      const query = { _id: bookingObjectId };
      const result = await bookingCollection.deleteOne(query);

      if (result.deletedCount === 1) {
        res.send({ success: true, message: "Booking deleted successfully." });
      } else {
        res.status(404).send({ success: false, message: "Booking not found." });
      }
    });
    app.post("/services/:serviceId/review", async (req, res) => {
      const serviceIdString = req.params.serviceId;
      const reviewData = req.body;
      let serviceObjectId;
      try {
        serviceObjectId = new ObjectId(serviceIdString);
      } catch (e) {
        console.error("Invalid serviceId format for review:", serviceIdString);
        return res
          .status(400)
          .send({ success: false, message: "Invalid service ID format." });
      }

      const reviewToInsert = {
        ...reviewData,
        date: new Date(reviewData.date),
        rating: parseInt(reviewData.rating),
      };

      try {
        const updateResult = await serviceCollection.updateOne(
          { _id: serviceObjectId },
          { $push: { reviews: reviewToInsert } }
        );

        if (updateResult.modifiedCount === 1) {
          res.send({ success: true, message: "Review added successfully." });
        } else if (updateResult.matchedCount === 0) {
          res
            .status(404)
            .send({ success: false, message: "Service not found." });
        } else {
          res.status(500).send({
            success: false,
            message: "Failed to update service with review.",
          });
        }
      } catch (error) {
        console.error("Error adding review:", error);
        res.status(500).send({
          success: false,
          message: "Internal server error during review submission.",
        });
      }
    });
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Hero Home server is running on port ${port} `);
});
