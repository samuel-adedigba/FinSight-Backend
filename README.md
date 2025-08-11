# FinSight Backend

A comprehensive financial insights backend service built with Node.js, providing real-time data processing and analytics capabilities.

## 🎯 Project Overview

FinSight Backend is a scalable microservices-based application designed to process financial data, provide analytics, and deliver insights through RESTful APIs. The system leverages modern technologies including PostgreSQL for data persistence, Redis for caching, and Apache Kafka for event-driven messaging.

### Key Features

- **Real-time Data Processing**: Event-driven architecture using Kafka for handling financial data streams
- **Secure Authentication**: JWT-based authentication and authorization system
- **Scalable Database Layer**: PostgreSQL with Prisma ORM for type-safe database operations
- **High-Performance Caching**: Redis integration for optimized data retrieval
- **Microservices Architecture**: Modular design with clear separation of concerns

## 🏗️ Architecture

### System Components

┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │ Client Apps │ │ Load Balancer │ │ API Gateway │ └─────────────────┘ └─────────────────┘ └─────────────────┘ │ │ │ └───────────────────────┼───────────────────────┘ │ ┌─────────────────┐ │ FinSight Backend│ └─────────────────┘ │ ┌────────────────────┼────────────────────┐ │ │ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │ PostgreSQL │ │ Redis │ │ Kafka │ │ Database │ │ Cache │ │ Messaging │ └─────────────┘ └─────────────┘ └─────────────┘

### Data Flow

1. **Input**: Financial data received via REST APIs or Kafka events
2. **Processing**: Business logic processes data using services layer
3. **Storage**: Data persisted in PostgreSQL with caching in Redis
4. **Events**: Significant events published to Kafka for downstream processing
5. **Output**: Processed insights delivered via REST APIs

## 📁 Project Structure

/project-root ├── /config │ └── index.js # Environment configuration and validation ├── /db │ ├── prisma.js # Prisma client initialization │ └── redis.js # Redis client configuration ├── /auth │ ├── jwt.js # JWT token utilities (sign/verify) │ └── middleware.js # Authentication middleware for Express ├── /messaging │ ├── kafkaProducer.js # Kafka producer setup │ ├── kafkaConsumer.js # Kafka consumer setup │ └── initKafka.js # Kafka initialization orchestrator ├── /services │ └── userService.js # Business logic layer ├── /routes │ └── userRoutes.js # Express route definitions ├── /prisma │ └── schema.prisma # Database schema definition ├── app.js # Express application setup ├── server.js # Server initialization and startup ├── .env* # Environment configuration files └── package.json # Dependencies and scripts

### Module Descriptions

- **config/**: Centralized configuration management using dotenv-flow
- **db/**: Database connection management (single Prisma client, Redis instance)
- **auth/**: JWT-based authentication system with middleware
- **messaging/**: Kafka integration for event-driven communication
- **services/**: Business logic layer interfacing with database and messaging
- **routes/**: HTTP route handlers that delegate to services

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Redis Server
- Apache Kafka (optional, for event processing)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd finsight-backend

   Install dependencies
npm install


Set up environment variables
cp .env.example .env
# Edit .env with your configuration


Initialize database
npx prisma migrate dev --name initial_setup
npx prisma generate


System Services Setup
PostgreSQL
# Check status
sudo systemctl status postgresql

# Start service
sudo systemctl start postgresql

# Enable auto-start
sudo systemctl enable postgresql


Redis
# Check status
sudo systemctl status redis-server

# Start service
sudo systemctl start redis-server

# Enable auto-start
sudo systemctl enable redis-server


Development Workflow
Database Management
# Create new migration
npx prisma migrate dev --name <descriptive_name>

# Generate Prisma client
npx prisma generate

# Deploy migrations (production)
npx prisma migrate deploy

# Quick sync (development only)
npx prisma db push

# Database inspection
npx prisma studio


Verification Commands
# Check database tables
psql -U postgres -d finSightDB -c '\dt'

# Test Redis connection
redis-cli ping  # Should return PONG

# Test API endpoint
curl http://localhost:5000/  # Should return "✅ FinSight backend is running."


🔧 Configuration
Environment Variables
NODE_ENVEnvironment modedevelopmentPORTServer port5000DATABASE_URLPostgreSQL connection string-REDIS_URLRedis connection string-JWT_SECRETJWT signing secret-KAFKA_BROKERSKafka broker addresses-
Database Configuration
The application uses PostgreSQL as the primary database with Prisma as the ORM. Connection details are configured via the DATABASE_URL environment variable.

📊 API Documentation
Base URL
http://localhost:5000


Health Check
GET /
Response: "✅ FinSight backend is running."


Authentication
All protected endpoints require a valid JWT token in the Authorization header:

Authorization: Bearer <jwt_token>


🧪 Testing
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration


🚀 Deployment
Production Setup
# Set environment
export NODE_ENV=production

# Install production dependencies
npm ci --only=production

# Run database migrations
npx prisma migrate deploy

# Start application
npm start


Docker Deployment
# Build image
docker build -t finsight-backend .

# Run container
docker run -p 5000:5000 finsight-backend



🤝 Contributing
Fork the repository
Create a feature branch (git checkout -b feature/amazing-feature)
Commit your changes (git commit -m 'Add amazing feature')
Push to the branch (git push origin feature/amazing-feature)
Open a Pull Request
📝 License
This project is licensed under the MIT License - see the LICENSE file for details.

🆘 Support
For support and questions:

Create an issue in the repository
Contact the development team
Check the documentation wiki
Built with ❤️ by the FinSight Team


<!-- 
Copy and paste the entire content above into your `README.md` file. This comprehensive README includes:

## What's Included:

✅ **Professional Overview** - Clear project description and purpose  
✅ **Architecture Diagram** - Visual system representation  
✅ **Complete File Structure** - Detailed project organization  
✅ **Setup Instructions** - Step-by-step installation guide  
✅ **Configuration Details** - Environment variables and settings  
✅ **API Documentation** - Basic endpoint documentation  
✅ **Development Workflow** - Commands for daily development  
✅ **Testing & Deployment** - Production-ready instructions  
✅ **Contributing Guidelines** - Standard open-source practices  

## Customization Notes:

Before using, you may want to update:
- Repository URL in the clone command
- Project name if different from "FinSight Backend"
- Specific API endpoints based on your actual routes
- License type if different from MIT
- Contact information in the Support section

This README will make your project look professional and provide comprehensive documentation for developers, stakeholders, and contributors.
 -->
