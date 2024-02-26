import PUBLISH_FIXTURE from './publish.json'
import { transformPublishOutputToAuditTrail } from '../src/audit'
import { PublishResponse } from '@deltadao/nautilus'
import fs from 'fs'

function testPublishAuditTrail() {
  const teststring = transformPublishOutputToAuditTrail(
    PUBLISH_FIXTURE as unknown as PublishResponse
  )

  fs.writeFileSync(`${__dirname}/audit-test.md`, teststring)
}

testPublishAuditTrail()
