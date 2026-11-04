# Long Lines, URLs, and Layout Overflow Resilience

This fixture tests how renderers handle continuous unbreakable text, extreme URLs, wide code blocks, and multi-column tables.

## Unbroken URL String
https://service.cloud.enterprise.internal/api/v3/organizations/org_9981247182910291823/deployments/dep_0192847192837192837192837/environments/production/audit-logs/query?filter=event_type%3Dpermission_escalation%26severity%3Dcritical%26cursor%3DeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9

## Continuous Monospace Code String
```bash
TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c_REALLY_LONG_CONTINUOUS_STRING_THAT_MUST_NOT_OVERFLOW_THE_PAGE_CONTAINER
```

## Wide Multi-Column Data Matrix
| Service | Region | Status | Latency | P95 | P99 | Throughput | Error Rate | CPU | Mem | Disk | Owner |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| auth-svc | us-east-1 | Healthy | 12ms | 24ms | 48ms | 14,200 rps | 0.001% | 42% | 61% | 18% | @security-core |
| billing-api | eu-west-1 | Healthy | 45ms | 88ms | 140ms | 3,100 rps | 0.000% | 35% | 48% | 22% | @fintech-eng |
| ingress-gw | ap-south-1 | Healthy | 8ms | 16ms | 32ms | 58,000 rps | 0.002% | 78% | 82% | 41% | @infra-traffic |
