# tomcat-ssl-performance
Tomcat SSL/TLS performance testing

## Generate cert for Tomcat
### Create Keystore

```
keytool -genkey -alias testing -keyalg RSA -keystore /tmp/testing.keystore
```

This prompts for a password followed by the cert subject details, `123456` was used for the password:

```
Enter keystore password:
Re-enter new password:
What is your first and last name?
  [Unknown]:  Performance Testing
What is the name of your organizational unit?
  [Unknown]:  Testing
What is the name of your organization?
  [Unknown]:  Performance
What is the name of your City or Locality?
  [Unknown]:  FakeTown
What is the name of your State or Province?
  [Unknown]:  FakeState
What is the two-letter country code for this unit?
  [Unknown]:  GB
Is CN=Performance Testing, OU=Testing, O=Performance, L=FakeTown, ST=FakeState, C=GB correct?
  [no]:  yes
```

### Create Cert Signing Request (CSR)

```
keytool -certreq -keyalg RSA -alias testing -file /tmp/testing.csr -keystore /tmp/testing.keystore
```

Enter password used when creating Keystore, e.g. `123456`

```
Enter keystore password:
```

## Run performance test

### Specify load test variables

In the `.env` file you can specify the number of users and the time to ramp up to that number (essentially req/s) and then ramp down, e.g.

```
NUMBER_OF_VIRTUAL_USERS=20000
RAMP_UP=5s
SUSTAIN=10s
RAMP_DOWN=5s
```
### Generate Tomcat server.xml

There are config files in the `/config` folder that specify `Connector` attributes to use in the `server.xml` file for the Tomcat. These can be used as an "input" to generate that file from the template `server-template.xml`, e.g.

```
python generate-server-xml.py tomcat-tls-1
```

This will use the `config/tomcat-tls-1.json` file to create/overwrite the `server.xml` file.

## Run Tomcat along with InfluxDB and Grafana

```
docker-compose up -d grafana influxdb tomcat
```

If you are repeating the test and have updated the `server.xml` file you can alternatively just recreate the `tomcat` container with the following:

```
docker-compose up -d --force-recreate tomcat
```

## Run K6 load test

```
docker-compose run --rm k6 run /scripts/load-test.js
```

This will run the load test and output a result summary in text in the terminal.

In the following example we can see only 91% of requests had a 200 response, and only 99% were received in less than 1s.

```
running (50.0s), 00000/20000 VUs, 126274 complete and 790 interrupted iterations
default ✓ [======================================] 00000/20000 VUs  20s

     ✗ response code was 200
      ↳  91% — ✓ 115249 / ✗ 11025
     ✗ response time < 1s
      ↳  99% — ✓ 126256 / ✗ 18

     checks.........................: 95.62% ✓ 241505      ✗ 11043
     data_received..................: 1.3 GB 27 MB/s
     data_sent......................: 16 MB  315 kB/s
     http_req_blocked...............: avg=127.53ms min=0s       med=2.62µs   max=4.79s    p(90)=5.86µs   p(95)=1.55s
     http_req_connecting............: avg=16.51ms  min=0s       med=0s       max=3.17s    p(90)=0s       p(95)=64.5µs
     http_req_duration..............: avg=49.21ms  min=0s       med=1.02ms   max=1.08s    p(90)=108.56ms p(95)=471.73ms
       { expected_response:true }...: avg=53.91ms  min=214.09µs med=1.2ms    max=1.08s    p(90)=123.73ms p(95)=496.93ms
     http_req_failed................: 8.73%  ✓ 11025       ✗ 115249
     http_req_receiving.............: avg=178.05µs min=0s       med=27.83µs  max=239.08ms p(90)=107.51µs p(95)=204.32µs
     http_req_sending...............: avg=974.96µs min=0s       med=9.36µs   max=246.6ms  p(90)=42.01µs  p(95)=456.48µs
     http_req_tls_handshaking.......: avg=111.37ms min=0s       med=0s       max=3.48s    p(90)=0s       p(95)=1.54s
     http_req_waiting...............: avg=48.05ms  min=0s       med=953.45µs max=1.06s    p(90)=91.89ms  p(95)=466.36ms
     http_reqs......................: 126274 2525.601825/s
     iteration_duration.............: avg=3.8s     min=1s       med=1s       max=31.63s   p(90)=4.06s    p(95)=31s
     iterations.....................: 126274 2525.601825/s
     vus............................: 217    min=217       max=20000
     vus_max........................: 20000  min=20000     max=20000
```



