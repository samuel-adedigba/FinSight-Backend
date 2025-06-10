// // /app.js
// import express from "express";
// import cors from "cors";
// import helmet from "helmet";
// import morgan from "morgan";

// const app = express();

// app.use(cors());
// app.use(helmet());
// app.use(
//   morgan(process.env.NODE_ENV === "production" ? "test" : "development")
// );
// app.use(express.json());


// app.get("/", (_, res) => {
//   res.send("✅ FinSight backend is running.");
// });


// export default app;

// app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import userRoutes from './routes/userRoutes.js';
import bankRouter from './routes/bankRoute.js';
import accountRouter from './routes/accountRoute.js';
import transferRouter from './routes/transferRoute.js';
import notificationRoutes from './routes/notificationRoutes.js';
import transactionRouter from './routes/transactionRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import categoryRouter from './routes/categoryRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import analyticsRoute from './routes/analyticsRoute.js';

// Polyfill __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());              

app.use(cors());
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'test' : 'dev'));

app.get("/", (_, res) => {
  res.send("✅ FinSight backend is running.");
});

// Serve static assets
app.use('/static', express.static(path.join(__dirname, '..', 'public')));

// Sync pages
app.get('/sync', (_, res) => res.redirect('/sync/step1'));
app.get('/widget', (req, res) =>
  res.sendFile(path.join(__dirname, '..', 'public', 'widget.html'))
);
app.get('/verify', (req, res) =>
  res.sendFile(path.join(__dirname, '..', 'public', 'verify.html'))
);
app.get('/sync/step1', (req, res) =>
  res.sendFile(path.join(__dirname, '..', 'public', 'step1.html'))
);
app.get('/sync/step2', (req, res) =>
  res.sendFile(path.join(__dirname, '..', 'public', 'step2.html'))
);
app.get('/sync/step3', (req, res) =>
  res.sendFile(path.join(__dirname, '..', 'public', 'step3.html'))
);
app.get('/sync/step4', (req, res) =>
  res.sendFile(path.join(__dirname, '..', 'public', 'step4.html'))
);


app.use('/api/auth', userRoutes);
app.use('/bank', bankRouter);
app.use('/account', accountRouter);
app.use('/transfer', transferRouter);
app.use('/notifications', notificationRoutes);
app.use('/transactions', transactionRouter);
app.use('/categories', categoryRouter); 
app.use('/budget', budgetRoutes); 
app.use('/analytics', analyticsRoute); 
export default app;
