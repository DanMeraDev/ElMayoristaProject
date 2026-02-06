# El Mayorista Project 🛒

**El Mayorista** is a comprehensive e-commerce management platform designed to streamline sales, commissions, and seller administration. The system features a robust backend for secure data handling and a modern, responsive frontend for an intuitive user experience.

## 🚀 Features

### 👤 User Roles & Authentication
- **Admin Panel**: Full control over users, sales, and system configuration.
- **Seller Portal**: Dedicated interface for sellers to track their sales, commissions, and performance.
- **Secure Authentication**: JWT-based authentication with role-based access control.

### 💰 Sales & Commission Management
- **Sales Tracking**: Real-time monitoring of sales status (Pending, Approved, Rejected).
- **Automated Commissions**: Calculation of seller commissions based on predefined rules.
- **Cycle Management**: Organize sales into cycles for periodic reporting and payouts.

### 📄 Reports & Documents
- **PDF Generation**: Automated creation of detailed sales reports.
- **PDF Parsing**: Intelligent extraction of data from uploaded sales documents.
- **Excel Export**: Downloadable reports for deeper analysis.

### ☁️ Cloud & AI Integration
- **Cloudflare R2 Storage**: Secure and scalable storage for payment receipts and documents.
- **OpenAI Integration**: AI-powered analysis for document processing and data extraction.

## 🛠️ Tech Stack

### Backend (Spring Boot)
- **Language**: Java 21
- **Framework**: Spring Boot 3.5.9
- **Database**: PostgreSQL
- **ORM**: Hibernate / Spring Data JPA
- **Security**: Spring Security + JWT
- **Cloud**: AWS SDK (compatible with Cloudflare R2)
- **AI**: OpenAI API

### Frontend (React)
- **Framework**: React + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Routing**: React Router DOM

## ⚙️ Setup & Installation

### Prerequisites
- Java 21 JDK
- Node.js (v18+)
- PostgreSQL Database

### Environment Variables
Create a `.env` file in the root of `ElMayoristaApplication/` (and potentially the project root) following the structure in `.env.example`:

```env
# Database
DB_URL=jdbc:postgresql://host:port/database_name
DB_USERNAME=your_username
DB_PASSWORD=your_password

# Email Service
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password

# OpenAI
OPENAI_API_KEY=sk-...

# Cloudflare R2
R2_ACCESS_KEY=...
R2_SECRET_KEY=...
R2_ENDPOINT=...
R2_BUCKET=...
R2_PUBLIC_URL=...

# App Config
APP_FRONTEND_URL=http://localhost:5173
```

### Running the Application

**Backend:**
```bash
cd ElMayoristaApplication
./mvnw spring-boot:run
```

**Frontend:**
```bash
cd mayorista-frontend
npm install
npm run dev
```

## 📝 License
This project is proprietary software developed for El Mayorista.
