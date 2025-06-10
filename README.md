# Check status of PostgreSQL service
sudo systemctl status postgresql               # :contentReference[oaicite:0]{index=0}

# If it’s not active, start it:
sudo systemctl start postgresql                # :contentReference[oaicite:1]{index=1}

# (Optional) Enable automatic start at boot:
sudo systemctl enable postgresql               # :contentReference[oaicite:2]{index=2}



#Redis

# Check status of Redis server
sudo systemctl status redis-server             # :contentReference[oaicite:3]{index=3}

# If it’s not running, start it:
sudo systemctl start redis-server              # :contentReference[oaicite:4]{index=4}

# (Optional) Enable it to start on boot:
sudo systemctl enable redis-server             # :contentReference[oaicite:5]{index=5}


psql -U postgres -d finSightDB -c '\dt'      # list tables; shows Prisma tables if migrations applied :contentReference[oaicite:9]{index=9}
redis-cli ping                              # should return PONG :contentReference[oaicite:10]{index=10}
curl http://localhost:5000/                  # should return “✅ FinSight backend is running.”




npx prisma migrate dev --name add_user_model
npx prisma generate

Whenever you change schema.prisma (add/remove fields or models), run:
npx prisma migrate dev --name descriptive_migration_name

# Once, to set up Prisma
npm install prisma --save-dev @prisma/client
npx prisma init

# Every time you change schema.prisma in development:
npx prisma migrate dev --name <meaningful_name>

# In production (after pulling migrations from Git):
npx prisma migrate deploy

# To quickly sync without migrations (only for prototyping):
npx prisma db push

# Inspect your database:
psql -U postgres -d finSightDB
npx prisma studio
npx prisma format

/project-root
├─ /config
│   └─ index.js            # Env loading & validation
├─ /db
│   ├─ prisma.js           # Prisma client
│   └─ redis.js            # Redis client
├─ /auth
│   ├─ jwt.js              # signToken, verifyToken utilities
│   └─ middleware.js       # Express JWT middleware
├─ /messaging
│   ├─ kafkaProducer.js    # KafkaJS producer initialization
│   ├─ kafkaConsumer.js    # KafkaJS consumer initialization
│   └─ initKafka.js        # connect both producer & consumer
├─ /services
│   └─ userService.js      # Business logic, uses db and messaging
├─ /routes
│   └─ userRoutes.js       # Express routers, calls services
├─ app.js                  # Defines Express app (no side effects)
├─ server.js               # Loads config, connects DB/Kafka, starts server
├─ .env*                   # Env files at project root
└─ package.json            # Scripts use cross-env for NODE_ENV

config/index.js: Loads .env* via dotenv-flow, validates required variables 
Stack Overflow
Medium
.

db/: Encapsulates database connections—one Prisma client for Postgres and a single Redis instance (avoid opening multiple connections per request) 
Medium
Stack Overflow
.

auth/: Houses JWT utility functions (jsonwebtoken) and a middleware that verifies tokens on protected routes 
DEV Community
.

messaging/: Uses kafkajs to create one producer and one consumer instance, connecting them at startup 
Medium
Medium
.

services/: Contains business logic, e.g., creating a user both in Postgres and publishing an event to Kafka.

routes/: Defines Express routers that call service methods, decoupling HTTP layer from business logic 
GeeksforGeeks
.

app.js & server.js split—app.js only declares middleware and routes (no listeners), while server.js wires config, connects DB/Kafka, and calls app.listen() for testability and separation 
DEV Community
Medium
.