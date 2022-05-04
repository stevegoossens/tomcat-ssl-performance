import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export let options = {
  stages: [
    { duration: __ENV.BAU_RAMP_UP, target: __ENV.BAU_USERS },
    { duration: __ENV.BAU_SUSTAIN_BEFORE, target: __ENV.BAU_USERS },
    { duration: __ENV.PEAK_RAMP_UP, target: __ENV.PEAK_USERS },
    { duration: __ENV.PEAK_SUSTAIN, target: __ENV.PEAK_USERS },
    { duration: __ENV.PEAK_RAMP_DOWN, target: __ENV.BAU_USERS },
    { duration: __ENV.BAU_SUSTAIN_AFTER, target: __ENV.BAU_USERS },
    { duration: __ENV.BAU_RAMP_DOWN, target: 0 },
  ],
  insecureSkipTLSVerify: true,
}

export let errorRate = new Rate("errors")

const params = {
  timeout: "5s"
}

export default function () {
  const res = http.get(`https://${__ENV.TOMCAT_HOST}:${__ENV.TOMCAT_PORT}`, params)
  const success = check(res, {
    'response code was 200': (res) => res.status == 200,
  })

  if (success) {
    check(res, {
      'response time < 1s': (res) => res.timings.duration < 1000,
    })
  } else {
    errorRate.add(1)
  }
  sleep(1)
}
