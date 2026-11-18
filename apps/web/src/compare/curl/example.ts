export const curlExample = [
  `curl 'https://api.example.com/v1/users?team=docs&limit=20' \\\n  -H 'Authorization: Bearer example-original-token' \\\n  -H 'Content-Type: application/json' \\\n  --data-raw '{"user":{"id":5,"role":"admin"},"active":true}'`,
  `curl 'https://api.example.com/v1/users?team=docs&limit=50' \\\n  -H 'Authorization: Bearer example-updated-token' \\\n  -H 'Content-Type: application/json' \\\n  --data-raw '{"active":true,"user":{"role":"editor","id":5}}'`,
];
