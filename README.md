<div align="center">

# 🏠 HomeHero — Server

### _The backbone powering the HomeHero services platform._

[![Live API](https://img.shields.io/badge/🚀_Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel)](https://vercel.com/)
[![Node.js](https://img.shields.io/badge/Node.js-Express_5-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/atlas)
[![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](LICENSE)

</div>

---

## ✨ About

**HomeHero Server** is the RESTful API backend for the HomeHero platform. It handles users, services, bookings, reviews, and role-based statistics — all backed by **MongoDB Atlas** and deployed on **Vercel**.

🌐 **Frontend:** [https://hero-home-service.web.app/](https://hero-home-service.web.app/)

---

## 📡 API Overview

### 🔐 User & Role Routes

| Method  | Endpoint             | Description                       |
| ------- | -------------------- | --------------------------------- |
| `POST`  | `/users`             | Register or find an existing user |
| `GET`   | `/users/role/:email` | Get a user's role                 |
| `GET`   | `/all-users`         | Get all users (Admin only)        |
| `PATCH` | `/users/admin/:id`   | Update a user's role              |

### 🛠️ Service Routes

| Method   | Endpoint                | Description                                          |
| -------- | ----------------------- | ---------------------------------------------------- |
| `GET`    | `/services`             | Get all services (paginated, filterable, searchable) |
| `GET`    | `/services/:id`         | Get a single service by ID                           |
| `GET`    | `/latest-services`      | Get the latest/top-rated services                    |
| `GET`    | `/services/user/:email` | Get services listed by a provider                    |
| `POST`   | `/services`             | Create a new service                                 |
| `PATCH`  | `/services/:id`         | Update a service                                     |
| `DELETE` | `/services/:id`         | Delete a service                                     |

### 📅 Booking Routes

| Method   | Endpoint        | Description          |
| -------- | --------------- | -------------------- |
| `GET`    | `/bookings`     | Get all bookings     |
| `POST`   | `/bookings`     | Create a new booking |
| `DELETE` | `/bookings/:id` | Cancel a booking     |

### ⭐ Review Routes

| Method | Endpoint                      | Description               |
| ------ | ----------------------------- | ------------------------- |
| `POST` | `/services/:serviceId/review` | Add a review to a service |

### 📊 Stats Routes

| Method | Endpoint                 | Description                   |
| ------ | ------------------------ | ----------------------------- |
| `GET`  | `/admin-stats`           | Platform-wide stats for admin |
| `GET`  | `/provider-stats/:email` | Stats for a service provider  |
| `GET`  | `/user-stats/:email`     | Stats for a regular customer  |

---

## 🔍 Query Parameters — `/services`

The services endpoint supports powerful filtering:

| Param       | Type   | Description                                  |
| ----------- | ------ | -------------------------------------------- |
| `page`      | number | Page number (default: 1)                     |
| `limit`     | number | Items per page (default: 20)                 |
| `category`  | string | Filter by category                           |
| `minPrice`  | number | Minimum price filter                         |
| `maxPrice`  | number | Maximum price filter                         |
| `search`    | string | Search name, description, category, provider |
| `sortBy`    | string | Field to sort by (default: `createdAt`)      |
| `sortOrder` | string | `asc` or `desc` (default: `desc`)            |

---

## 🛠️ Tech Stack

| Category    | Technology                          |
| ----------- | ----------------------------------- |
| Runtime     | Node.js                             |
| Framework   | Express 5                           |
| Database    | MongoDB Atlas (via Mongoose driver) |
| Environment | dotenv                              |
| CORS        | cors                                |
| Deployment  | Vercel                              |

---

## 🗂️ Project Structure

```
home-hero-server/
├── index.js          # Main server entry point
├── .env              # Environment variables (not committed)
├── .vercel/          # Vercel deployment config
├── package.json
└── .gitignore
```

---

## ⚡ Getting Started

### Prerequisites

- Node.js ≥ 18
- A MongoDB Atlas cluster

### Installation

```bash
# Clone the repository
git clone https://github.com/habib-web-dev1/home-hero-server.git
cd home-hero-server

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
DB_USER=your_mongodb_username
DB_PASS=your_mongodb_password
PORT=5000
```

### Run Locally

```bash
npm start
```

Server will be running at [http://localhost:5000](http://localhost:5000).

You should see:

```json
{
  "message": "HomeHero Server Running",
  "version": "2.0.0",
  "status": "healthy"
}
```

---

## 🚀 Deployment

This server is deployed on **Vercel**. The `vercel.json` (if present) or default Node.js preset handles routing.

To deploy your own instance:

```bash
npm install -g vercel
vercel
```

---

## 🔒 Security Notes

- Input validation on all service creation requests
- ObjectId format validation before DB queries
- Email format validation on relevant endpoints
- CORS restricted to known origins
- Environment variables used for all secrets

---

## 🔗 Related Repositories

- 💻 **Frontend / Client:** [home-hero-client](https://github.com/habib-web-dev1/home-hero-client)

---

## 📄 License

This project is for portfolio and demonstration purposes.

---

<div align="center">
  Built with ❤️ by <a href="https://github.com/habib-web-dev1">habib-web-dev1</a>
</div>
