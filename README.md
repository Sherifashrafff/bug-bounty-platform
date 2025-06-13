# bug-bounty-platform
This is the backend of a full-featured Bug Bounty Platform built with Node.js, Express, and MongoDB. It enables secure and structured communication between organizations and security researchers, allowing for secure vulnerability reporting, program management, and rewards distribution.

Here is a complete and professional `README.md` file you can copy directly into your project:

---

```markdown
# 🐞 Bug Bounty Platform – Backend

This is the backend of a full-featured **Bug Bounty Platform** built using **Node.js**, **Express.js**, and **MongoDB**. It allows secure collaboration between **organizations** and **security researchers** for reporting, managing, and resolving vulnerabilities in a structured and efficient way.

---

## 🔧 Features

- **Authentication & Authorization**
  - Register/login for both users and organizations
  - Role-based access for researchers, orgs, and admins

- **Program Management**
  - Organizations can create, edit, and manage bug bounty programs
  - Program images and descriptions included

- **Vulnerability Submissions**
  - Researchers can submit detailed vulnerability reports
  - Includes severity, affected targets, and file attachments

- **Submission Workflow**
  - Organizations can review, triage, update status/severity, assign rewards
  - Structured activity log for submission updates

- **Invitations & Engagements**
  - Private program invites for researchers
  - Researcher engagement tracking

- **Static File Serving**
  - HTML pages served for Clients, Researchers, and Admins

- **File Uploads**
  - Screenshots, attachments stored securely using Multer

- **Security**
  - NoSQL injection protection using `express-mongo-sanitize`
  - Centralized error handling
  - Mongoose schema validation for all input

---

## 📁 Folder Structure

```

Backend/
├── Controllers/           # Route logic (users, orgs, programs, submissions)
├── Models/                # Mongoose schemas
├── Routes/                # Express routers
├── Utilities/             # Error handling, custom helpers
├── uploads/               # Uploaded images/files
├── data/                  # Static data directory
├── serveStaticFiles.js    # Static file router for HTML frontends
├── app.js                 # Express application
├── server.js              # App entry point

````

---

## 🚀 Tech Stack

- **Node.js** (Express)
- **MongoDB** with **Mongoose**
- **Multer** for file uploads
- **CORS** enabled
- **Morgan** for logging (in development)
- **express-mongo-sanitize** for NoSQL injection protection

---

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/bug-bounty-platform.git
cd bug-bounty-platform
````

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Environment Variables

Create a `.env` file in the root and add:

```
NODE_ENV=development
PORT=3000
DATABASE=mongodb://localhost:27017/bug-bounty
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=30d
```

> Update values as needed.

### 4. Start the Server

```bash
npm start
```

Server runs on `http://localhost:3000/` by default.

---

## 📦 API Endpoints

| Route Prefix         | Description              |
| -------------------- | ------------------------ |
| `/api/v1/users`      | User-related actions     |
| `/api/v1/orgs`       | Organization management  |
| `/api/v1/submission` | Report submission routes |
| `/api/v1/programs`   | Program creation/editing |

---

## 📄 Static Frontends Served

HTML files for UI served from:

* `/Client/*` – Organization/Client pages
* `/Researcher/*` – Researcher dashboard
* `/Admin/*` – Admin interface
* `/login`, `/resetpassword`, `/landpage` – Login & landing pages

---

## 🙋‍♂️ Author

**Sherif Ashraf**
**Abd-El-Rahman Mohamed**
