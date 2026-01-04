const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@ahserver.lso3nfx.mongodb.net/?appName=AHServer`;

// Create client
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
    // Connect to MongoDB
    // await client.connect(); // Optional for Vercel deployment

    const db = client.db("home_db");
    const serviceCollection = db.collection("services");
    const bookingCollection = db.collection("bookings");
    const userCollection = db.collection("users");

    // ================= USER & ROLE ROUTES =================

    // Save or Update user on Login/Register
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: "User already exists", insertedId: null });
      }

      const result = await userCollection.insertOne({
        ...user,
        role: "user", // Default role
        createdAt: new Date(),
      });
      res.send(result);
    });

    // Get User Role
    app.get("/users/role/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const user = await userCollection.findOne({ email });
        res.send({ role: user?.role || "user" });
      } catch (error) {
        res.status(500).send({ message: "Error fetching role" });
      }
    });

    // Admin Only: Get All Users
    app.get("/all-users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    // Update User Role (Admin Action)
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const { role } = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: { role: role },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // ================= SERVICE ROUTES =================

    app.get("/services", async (req, res) => {
      const cursor = serviceCollection.find();
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
      try {
        const sortCriteria = {
          createdAt: -1,
          reviewCount: -1,
          averageRating: -1,
        };
        const result = await serviceCollection
          .find({})
          .sort(sortCriteria)
          .limit(6)
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to fetch services." });
      }
    });

    app.post("/services", async (req, res) => {
      const newService = req.body;
      const result = await serviceCollection.insertOne(newService);
      res.send(result);
    });

    app.get("/services/user/:email", async (req, res) => {
      const email = req.params.email;
      const query = { "provider.email": email };
      const result = await serviceCollection.find(query).toArray();
      res.send(result);
    });

    app.patch("/services/:id", async (req, res) => {
      const id = req.params.id;
      const updateService = req.body;
      const query = { _id: new ObjectId(id) };
      const update = { $set: updateService };
      const result = await serviceCollection.updateOne(query, update);
      res.send(result);
    });

    app.delete("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await serviceCollection.deleteOne(query);
      res.send(result);
    });

    // ================= BOOKING ROUTES =================

    app.get("/bookings", async (req, res) => {
      const result = await bookingCollection.find().toArray();
      res.send(result);
    });

    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      try {
        const bookingToInsert = {
          ...booking,
          serviceId: new ObjectId(booking.serviceId),
          createdAt: new Date(),
        };
        const result = await bookingCollection.insertOne(bookingToInsert);
        res.status(201).send(result);
      } catch (e) {
        res.status(400).send({ message: "Invalid ID format." });
      }
    });

    app.delete("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });

    // ================= REVIEW LOGIC =================

    app.post("/services/:serviceId/review", async (req, res) => {
      const serviceIdString = req.params.serviceId;
      const reviewData = req.body;
      const serviceObjectId = new ObjectId(serviceIdString);

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
          const updatedService = await serviceCollection.findOne({
            _id: serviceObjectId,
          });
          if (updatedService?.reviews) {
            const reviews = updatedService.reviews;
            const totalReviews = reviews.length;
            const ratingSum = reviews.reduce((sum, r) => sum + r.rating, 0);
            const newAverageRating =
              totalReviews > 0 ? ratingSum / totalReviews : 0;

            await serviceCollection.updateOne(
              { _id: serviceObjectId },
              {
                $set: {
                  averageRating: newAverageRating,
                  reviewCount: totalReviews,
                },
              }
            );
          }
          res.send({ success: true, message: "Review added successfully." });
        }
      } catch (error) {
        res
          .status(500)
          .send({ success: false, message: "Internal server error." });
      }
    });
    // Dashboard Stats Route
    app.get("/provider-stats/:email", async (req, res) => {
      try {
        const email = req.params.email;

        //  Get total services added by this provider
        const serviceCount = await serviceCollection.countDocuments({
          "provider.email": email,
        });

        //  Get total bookings for this provider's services

        const bookingCount = await bookingCollection.countDocuments({
          providerEmail: email,
        });

        // Get total revenue (sum of prices from bookings)
        const bookings = await bookingCollection
          .find({ providerEmail: email })
          .toArray();
        const totalRevenue = bookings.reduce(
          (sum, booking) => sum + (parseFloat(booking.price) || 0),
          0
        );

        res.send({
          serviceCount,
          bookingCount,
          totalRevenue,
        });
      } catch (error) {
        console.error("Stats fetch error:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });
    // Admin Stats
    app.get("/admin-stats", async (req, res) => {
      const userCount = await userCollection.countDocuments();
      const serviceCount = await serviceCollection.countDocuments();
      const bookingCount = await bookingCollection.countDocuments();
      // Simplified revenue calculation
      const bookings = await bookingCollection.find().toArray();
      const totalRevenue = bookings.reduce(
        (sum, b) => sum + (parseFloat(b.price) || 0),
        0
      );
      res.send({ userCount, serviceCount, bookingCount, totalRevenue });
    });

    // User (Customer) Stats
    app.get("/user-stats/:email", async (req, res) => {
      const email = req.params.email;
      const bookingCount = await bookingCollection.countDocuments({
        userEmail: email,
      });
      const bookings = await bookingCollection
        .find({ userEmail: email })
        .toArray();
      const totalSpent = bookings.reduce(
        (sum, b) => sum + (parseFloat(b.price) || 0),
        0
      );
      res.send({ bookingCount, totalSpent, reviewCount: 0, pendingCount: 0 });
    });
    console.log("Connected to MongoDB successfully!");
  } finally {
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Hero Home server is running on port ${port}`);
});
