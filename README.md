# pushpackage

## Description

Node package to generate Apple pushPackages for Web Push Notifications

## Generate Certificates

$ openssl pkcs12 -export -clcerts -inkey fixtures/certificate.key -in fixtures/certificate.crt -out fixtures/certificate.p12 -name "password"
