import { Router } from 'express';
import authRoutes from './auth.routes';
import studentRoutes from './student.routes';
import adminRoutes from './admin.routes';
import uploadsRoutes from './uploads.routes';
import financeRoutes from './finance.routes';
import academyRoutes from './academy.routes';
import consultancyRoutes from './consultancy.routes';
import hrRoutes from './hr.routes';
import supportRoutes from './support.routes';
import supplierRoutes from './supplier.routes';
import payrollRoutes from './payroll.routes';
import ledgerRoutes from './ledger.routes';
import communicationRoutes from './communication.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/uploads', uploadsRoutes);
router.use('/student', studentRoutes);
router.use('/admin', adminRoutes);
router.use('/finance', financeRoutes);
router.use('/academy', academyRoutes);
router.use('/consultancy', consultancyRoutes);
router.use('/hr', hrRoutes);
router.use('/support', supportRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/payroll', payrollRoutes);
router.use('/ledger', ledgerRoutes);
router.use('/communication', communicationRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
