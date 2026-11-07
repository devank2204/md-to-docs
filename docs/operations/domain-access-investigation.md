# mdtodocs.com office-access incident

Investigated 2026-11-07. Status: **public configuration verified; office access
is still unresolved pending an affected-client observation.** No production DNS,
certificate, website configuration or office network policy was changed.

## Verified findings

| Layer | Observation | Implication |
| --- | --- | --- |
| Registrar / delegation | BigRock nameservers `dns1.bigrock.in` through `dns4.bigrock.in`; RDAP delegation agrees | No observed registrar/delegation mismatch |
| Apex IPv4 | Google DNS and Cloudflare return `75.2.60.5`, Netlify's documented external-DNS apex address | Current apex record is consistent with Netlify instructions |
| Apex IPv6 | No AAAA answer; successful NOERROR response | No observed stray IPv6 route to another host; an absent AAAA is valid here |
| `www` | CNAME to `mdtodocs.netlify.app` | Correct site-specific external-DNS subdomain target |
| DNSSEC | No parent DS; registration reports unsigned delegation | Not a dangling DS / signed-delegation mismatch; unsigned is not equivalent to broken DNSSEC |
| Security DNS samples | Cloudflare security and family resolvers return the normal apex address | Those two public filters did not block this query; this says nothing definitive about the office filter |
| HTTP and HTTPS | Apex returns 200; HTTP redirects to HTTPS; `www` redirects to apex | No observed redirect loop; `www` currently ends at the same apex |
| Application | Both hosts load `/assets/index-B9eYEPIA.js` and `/assets/index-DovBE3jB.css` | Same app assets at observation time; HTML differs by a Netlify hosting comment |
| Netlify public metadata | Site `mdtodocs` has `custom_domain: mdtodocs.com` | Custom domain is associated with the expected site |
| Independent origin TLS | SSL Labs completed apex assessment: A+, no endpoint warnings; TLS 1.2 and 1.3 | Public origin is reachable and has a trusted normal SNI certificate chain from that test location |
| Certificate | Let's Encrypt YE2, SANs apex and `www`, valid Oct 15 2026–Jan 13 2027 | No observed expired or missing-name certificate in normal SNI service |

Evidence: [machine-readable snapshot](domain-access-evidence.json).

Local HTTPS requests went through the environment's inspected proxy, so they were
not used as the sole proof of origin TLS. SSL Labs independently reached the
origin and reported trust paths for Windows, Apple, Android, Mozilla and Java.
Certificate transparency history from crt.sh was incomplete/stale relative to
Cert Spotter and the certificate actually observed by SSL Labs; an old historical
certificate must not be mistaken for the currently served one.

## Leading explanations, not confirmed root causes

1. **Office domain/category filtering.** RDAP registration is
   `2026-10-15T20:21:42Z`, around 23 days before this investigation. Palo Alto
   documents a 32-day newly registered domain category; Zscaler also provides
   new-domain categories. The office may instead restrict unknown sites or file
   converters. Its actual vendor, category and policy are unknown. A friend's
   allowed site can have a different category, age, allowlist entry or host route.
2. **Office TLS inspection compatibility.** Normal SNI TLS passes independent
   checks. Netlify's default no-SNI response instead presents `*.netlify.app`,
   which does not cover `mdtodocs.com`; this is expected shared-hosting behavior,
   not proof that a modern browser receives the wrong certificate. An older proxy
   omitting SNI, failing ECDSA support or rejecting a newer Let's Encrypt chain
   could fail while the Netlify hostname works. Office TLS logs are needed.
3. **Office resolver/cache or apex-route failure.** Apex uses Netlify's shared
   `75.2.60.5` entry point, while the Netlify hostname and `www` CNAME resolve to
   regional CDN addresses. An office resolver block, stale answer, or blocked
   route to the apex address could therefore produce different outcomes. Current
   public answers alone cannot establish the office's answer or route.

The zone currently has long cache durations (some resolver answers showed up to
604800 seconds). That could prolong a real record change, but it does not prove
this month-long symptom is propagation. No TTL change is proposed as a guessed
fix, and age-based automatic unblocking on a particular date is not guaranteed.

## Required observation from the affected office laptop

First collect the browser's exact error or block-page vendor/category text.
Examples: `DNS_PROBE_FINISHED_NXDOMAIN`, `ERR_NAME_NOT_RESOLVED`,
`ERR_CERT_AUTHORITY_INVALID`, `ERR_CERT_COMMON_NAME_INVALID`,
`ERR_CONNECTION_TIMED_OUT`, or a named web-filter block. These lead to different
repairs; an unavailable site is not itself a DNS diagnosis.

These read-only commands can provide a comparison in Windows Terminal:

```powershell
nslookup mdtodocs.com
nslookup www.mdtodocs.com
nslookup mdtodocs.netlify.app
curl.exe -I --connect-timeout 10 --max-time 20 https://mdtodocs.com
curl.exe -I --connect-timeout 10 --max-time 20 https://mdtodocs.netlify.app
```

No DNS/proxy/VPN settings are changed. Do not add `-k`: the certificate error is
useful evidence. Curl and the browser may use different corporate proxy/PAC
configuration, so disagreement needs interpretation rather than assuming one is
correct. Share the domain answers, error and relevant block text; full internal
network details, cookies and authorization headers are unnecessary.

## Repair decision

| Affected-office finding | Concrete repair |
| --- | --- |
| Explicit new/unknown/converter category block | Company IT reviews the site and, if approved, allows the exact apex and `www` hostnames or corrects its categorization through the vendor. Website DNS cannot override company policy. |
| Corporate DNS returns NXDOMAIN/sinkhole or an old address while public DNS is correct | Company IT inspects its resolver policy/zone/cache and fixes the local record/block. Change public records only if authoritative evidence shows they are wrong. |
| Browser/corporate proxy reports a certificate or SNI issue | Compare the corporate-presented certificate with the independent origin chain; IT fixes inspection trust/SNI/crypto compatibility. Netlify support investigates only a reproducible origin issue. |
| Office route to `75.2.60.5` times out, while the site-specific CDN route works | Verify with IT/Netlify logs before considering Netlify DNS or a primary-domain routing change. `www` currently redirects back to apex, so just sharing `www` is not an established fix. |
| Both URLs fail from a client while public probes succeed | Investigate that client's connectivity/proxy/endpoint controls before changing production DNS. |

Keep the existing verified records while collecting that evidence. Do not replace
apex A with a CNAME on a conventional DNS provider, add guessed AAAA records,
rotate a working certificate, migrate nameservers without preserving the full
zone, or treat an app-code deployment as a DNS repair.

## Draft for company IT — prepared, not sent

> Please investigate access to `https://mdtodocs.com` and
> `https://www.mdtodocs.com` from the company network/managed laptop. The working
> comparison is `https://mdtodocs.netlify.app`. This is a browser-based Markdown
> document-conversion tool intended for our developers. Public Google/Cloudflare
> DNS resolves the apex to Netlify's documented `75.2.60.5`; the independent origin
> TLS assessment passed at A+ with a valid certificate for both custom hostnames.
> Please check the URL/DNS category, matching rule, resolver answer and TLS
> inspection log for an affected request. The domain registration date is Oct 15
> 2026, so a newly registered/unknown category may be relevant. If the site is
> approved for use, please allow the exact hostnames or correct the category.
> Please do not allowlist the whole shared hosting IP range. We can supply the
> browser error and request timestamp for correlation.

## Verification and access limits

Public checks do not reproduce the office incident. Closing it requires an actual
successful load from an affected company user, followed by testing the converter
and verifying that the relevant policy/record repair persists. No messages or
recategorization requests were sent. Netlify SSL administration requires
credentials (read returned 401); no DNS or Netlify admin connection is configured
in this environment. Public metadata reads did not provide mutation authority.

## References

- [Netlify external DNS configuration](https://docs.netlify.com/manage/domains/configure-domains/configure-external-dns/)
- [Verisign domain RDAP](https://rdap.verisign.com/com/v1/domain/mdtodocs.com)
- [SSL Labs apex report](https://www.ssllabs.com/ssltest/analyze.html?d=mdtodocs.com)
- [Palo Alto URL categories](https://docs.paloaltonetworks.com/advanced-url-filtering/administration/url-filtering-basics/url-categories)
- [Palo Alto category review](https://docs.paloaltonetworks.com/advanced-url-filtering/administration/monitoring/request-to-change-the-category-for-a-url)
- [Zscaler Site Review guidance](https://help.zscaler.com/zia/looking-up-urls-site-review)
