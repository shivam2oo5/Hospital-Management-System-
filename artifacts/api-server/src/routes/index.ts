import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import departmentsRouter from "./departments";
import doctorsRouter from "./doctors";
import patientsRouter from "./patients";
import appointmentsRouter from "./appointments";
import wardsRouter from "./wards";
import admissionsRouter from "./admissions";
import medicalRecordsRouter from "./medical-records";
import labOrdersRouter from "./lab-orders";
import medicinesRouter from "./medicines";
import invoicesRouter from "./invoices";
import staffRouter from "./staff";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(departmentsRouter);
router.use(doctorsRouter);
router.use(patientsRouter);
router.use(appointmentsRouter);
router.use(wardsRouter);
router.use(admissionsRouter);
router.use(medicalRecordsRouter);
router.use(labOrdersRouter);
router.use(medicinesRouter);
router.use(invoicesRouter);
router.use(staffRouter);

export default router;
