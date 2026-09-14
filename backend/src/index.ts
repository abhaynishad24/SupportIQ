import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { 
  createTicket, 
  getTickets, 
  getMetrics, 
  updateTicketStatus,
  updateTicketDetails,
  deleteTicket
} from './controllers/ticketController.js';
import { 
  register, 
  login, 
  forgotPassword, 
  resetPassword, 
  logout 
} from './controllers/authController.js';
import { authenticateRole } from './middleware/auth.js';

dotenv.config();
const app = express();

// Store uploaded files in memory; the controller saves them in the database.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
    callback(null, allowed.includes(file.mimetype));
  }
});

app.use(cors());
app.use(express.json());

// Root test route
app.get('/', (_req, res) => {
  res.send('SupportIQ Backend API is running successfully!');
});

// ==========================================
// 1. Auth Routes (Public)
// ==========================================
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.post('/api/auth/forgot-password', forgotPassword);
app.post('/api/auth/reset-password', resetPassword);
app.post('/api/auth/logout', logout);

// ==========================================
// 2. Ticket Routes (Protected with RBAC)
// ==========================================

// Public / All-Role Routes
app.post('/api/tickets', authenticateRole(['USER', 'ADMIN']), upload.single('attachment'), createTicket);
app.get('/api/tickets', authenticateRole(['USER', 'ADMIN']), getTickets);

// Restricted Routes
app.get('/api/tickets/metrics', authenticateRole(['ADMIN']), getMetrics);
app.patch('/api/tickets/:id/status', authenticateRole(['ADMIN']), updateTicketStatus);
app.patch('/api/tickets/:id', authenticateRole(['USER']), updateTicketDetails);
app.delete('/api/tickets/:id', authenticateRole(['USER']), deleteTicket);

// Local Development ke liye listen
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
  });
}

// VERY IMPORTANT FOR VERCEL
export default app;