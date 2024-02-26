import COMPUTE_JOB from './computeJob.json'
import COMPUTE_STATUS from './computeStatus.json'
import fs from 'fs'
import { transformComputeResponseToReport } from '../src/consumption'

function testConsumptionReport() {
  const teststring = transformComputeResponseToReport(
    COMPUTE_JOB,
    COMPUTE_STATUS
  )

  fs.writeFileSync(`${__dirname}/consumption-test.md`, teststring)
}

testConsumptionReport()
