import * as dotenv from 'dotenv'
import { createPublishAuditTrail } from './audit'
import { createConsumptionReport } from './consumption'
dotenv.config()

// createPublishAuditTrail()

createConsumptionReport()
