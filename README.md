<div align="center">

# 🛠️ HomeHero API – Server Side
<br/><br/>

**The robust backend engine powering HomeHero: Secure API endpoints, real-time data processing, and protected database management.**

<img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>
<img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express"/>
<img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB"/>
<img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white" alt="JWT"/>
<img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel"/>

</div>

## 📖 Overview
This repository contains the RESTful API for **HomeHero**. It handles sensitive operations including user authorization verification, service management (CRUD), and the booking logic that ensures data integrity across the platform.

---

## 🛡️ Core Backend Features

* **JWT Authentication:** Custom middleware to verify JSON Web Tokens, ensuring only authorized users can modify services or view private bookings.
* **Security & Validation:** Implementation of `cors` for cross-origin resource sharing and `dotenv` for secure environment variable management.
* **MongoDB Aggregation:** Advanced queries to power the "Top 6 Rated" services and real-time search filtering.
* **Role-Based Logic:** Backend checks to prevent users from booking their own services or deleting data belonging to other providers.
* **Error Handling:** Global error-handling middleware to ensure clear, consistent API responses.

---

## 📡 API Endpoints (Quick Reference)

### 🔓 Public Endpoints
| Method | Endpoint | Description |
|:--- |:--- |:--- |
| `GET` | `/services` | Fetch all available services (with search/filter) |
| `GET` | `/services/:id` | Get detailed information for a single service |
| `GET` | `/top-rated` | Get the 6 highest-rated services for the home page |

### 🔐 Protected Endpoints (Requires JWT)
| Method | Endpoint | Description |
|:--- |:--- |:--- |
| `POST` | `/services` | Add a new household service |
| `PATCH` | `/services/:id` | Update a service (Provider only) |
| `DELETE` | `/services/:id` | Delete a service (Provider only) |
| `POST` | `/bookings` | Create a new booking request |
| `GET` | `/my-bookings` | Fetch bookings made by the current user |
| `GET` | `/my-services` | Fetch services listed by the current provider |

---

## 🛠️ Tech Stack & Dependencies

* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB (via MongoDB Atlas)
* **Security:** JWT (JsonWebToken), Firebase Admin SDK
* **Deployment:** Vercel

---

## ⚙️ Environment Variables Setup

To run this server locally, create a `.env` file in the root directory and add:
