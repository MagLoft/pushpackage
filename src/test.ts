import { readFileSync, createWriteStream, writeFileSync } from 'fs'
import * as pushpackage from '.'

async function main() {
  // Prepare Options
  const pem = readFileSync('fixtures/certificates/certificate.pem', 'utf8')
  const crt = readFileSync('fixtures/certificates/certificate.crt', 'utf8')
  const key = readFileSync('fixtures/certificates/certificate.key', 'utf8')
  const content = readFileSync('fixtures/pushpackage/manifest.json')

  // Sign Manifest
  writeFileSync('fixtures/pushpackage/signature.pem.bin', pushpackage.sign(content, { pem }), 'binary')
  writeFileSync('fixtures/pushpackage/signature.crt.bin', pushpackage.sign(content, { key, crt }), 'binary')

  // Create Push Package
  const output = createWriteStream('fixtures/output.pushPackage')
  const entries = [
    { name: 'sample.txt', buffer: Buffer.from('awesome') },
    { name: 'sample2.txt', buffer: Buffer.from('hello world') }
  ]
  await pushpackage.pipe(entries, output, { key, crt })
}

main()
