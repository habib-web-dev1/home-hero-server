const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// Enhanced Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "https://hero-home-service.web.app"],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
};

// Input validation middleware
const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid ID format" });
  }
  next();
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateService = (service) => {
  const required = [
    "name",
    "category",
    "price",
    "description",
    "image",
    "provider",
  ];
  const missing = required.filter((field) => !service[field]);

  if (missing.length > 0) {
    return {
      valid: false,
      message: `Missing required fields: ${missing.join(", ")}`,
    };
  }

  if (typeof service.price !== "number" || service.price <= 0) {
    return { valid: false, message: "Price must be a positive number" };
  }

  if (!service.provider.email || !validateEmail(service.provider.email)) {
    return { valid: false, message: "Valid provider email is required" };
  }

  return { valid: true };
};

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
  res.json({
    message: "HomeHero Server Running",
    version: "2.0.0",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
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

    // Get all services with pagination and filtering
    app.get("/services", async (req, res) => {
      try {
        const {
          page = 1,
          limit = 20,
          category,
          minPrice,
          maxPrice,
          search,
          sortBy = "createdAt",
          sortOrder = "desc",
        } = req.query;

        let query = {};

        // Category filter
        if (category && category !== "All Categories") {
          query.category = category;
        }

        // Price range filter
        if (minPrice || maxPrice) {
          query.price = {};
          if (minPrice) query.price.$gte = parseFloat(minPrice);
          if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }

        // Search filter
        if (search) {
          query.$or = [
            { name: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
            { category: { $regex: search, $options: "i" } },
            { "provider.name": { $regex: search, $options: "i" } },
          ];
        }

        // Sorting
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const services = await serviceCollection
          .find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(parseInt(limit))
          .toArray();

        const total = await serviceCollection.countDocuments(query);

        res.json({
          success: true,
          data: services,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
          },
        });
      } catch (error) {
        console.error("Error fetching services:", error);
        res
          .status(500)
          .json({ success: false, message: "Failed to fetch services" });
      }
    });

    app.get("/services/:id", validateObjectId, async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await serviceCollection.findOne(query);

        if (!result) {
          return res
            .status(404)
            .json({ success: false, message: "Service not found" });
        }

        res.json({ success: true, data: result });
      } catch (error) {
        console.error("Error fetching service:", error);
        res
          .status(500)
          .json({ success: false, message: "Failed to fetch service" });
      }
    });

    app.get("/latest-services", async (req, res) => {
      try {
        const { limit = 6 } = req.query;
        const sortCriteria = {
          createdAt: -1,
          averageRating: -1,
        };
        const result = await serviceCollection
          .find({})
          .sort(sortCriteria)
          .limit(parseInt(limit))
          .toArray();
        res.json({ success: true, data: result });
      } catch (error) {
        console.error("Error fetching latest services:", error);
        res
          .status(500)
          .json({ success: false, message: "Failed to fetch services." });
      }
    });

    app.post("/services", async (req, res) => {
      try {
        const serviceData = req.body;

        // Validate service data
        const validation = validateService(serviceData);
        if (!validation.valid) {
          return res
            .status(400)
            .json({ success: false, message: validation.message });
        }

        const newService = {
          ...serviceData,
          price: parseFloat(serviceData.price),
          reviews: [],
          averageRating: 0,
          reviewCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await serviceCollection.insertOne(newService);
        res.status(201).json({ success: true, insertedId: result.insertedId });
      } catch (error) {
        console.error("Error creating service:", error);
        res
          .status(500)
          .json({ success: false, message: "Failed to create service" });
      }
    });

    app.get("/services/user/:email", async (req, res) => {
      try {
        const email = req.params.email;
        if (!validateEmail(email)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid email format" });
        }

        const query = { "provider.email": email };
        const result = await serviceCollection
          .find(query)
          .sort({ createdAt: -1 })
          .toArray();
        res.json({ success: true, data: result });
      } catch (error) {
        console.error("Error fetching user services:", error);
        res
          .status(500)
          .json({ success: false, message: "Failed to fetch services" });
      }
    });

    app.patch("/services/:id", validateObjectId, async (req, res) => {
      try {
        const id = req.params.id;
        const updateData = { ...req.body, updatedAt: new Date() };

        // Remove fields that shouldn't be updated directly
        delete updateData._id;
        delete updateData.reviews;
        delete updateData.averageRating;
        delete updateData.reviewCount;
        delete updateData.createdAt;

        const query = { _id: new ObjectId(id) };
        const update = { $set: updateData };
        const result = await serviceCollection.updateOne(query, update);

        if (result.matchedCount === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Service not found" });
        }

        res.json({ success: true, modifiedCount: result.modifiedCount });
      } catch (error) {
        console.error("Error updating service:", error);
        res
          .status(500)
          .json({ success: false, message: "Failed to update service" });
      }
    });

    app.delete("/services/:id", validateObjectId, async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await serviceCollection.deleteOne(query);

        if (result.deletedCount === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Service not found" });
        }

        res.json({ success: true, deletedCount: result.deletedCount });
      } catch (error) {
        console.error("Error deleting service:", error);
        res
          .status(500)
          .json({ success: false, message: "Failed to delete service" });
      }
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
  } catch (error) {
    console.error("MongoDB connection error:", error);
  } finally {
    // Don't close the connection in serverless environments
  }
}

// Use error handling middleware
app.use(errorHandler);

// 404 handler - catch all unmatched routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Hero Home server is running on port ${port}`);
});
