# TariffShield public calculator source relay

The requested outcome remains every advertised app feature working. This change
connects the existing exact public calculator to the app's current-source gate;
it does not establish broader tariff coverage or completed live feature acceptance.
No marketing copy, listing, pricing or tariff rule is changed here.

The browser posts all existing normalized strings, including entry/per-unit basis,
to `/api/authority-duty` on the same origin. Its input fingerprint, signed identity,
expiry, line semantics and half-even arithmetic checks remain required before
displaying numbers. Countries remain non-numerical reference data from DutyCalc.

The Pages Function accepts only same-origin JSON POST requests. It refuses unknown
keys, duplicate keys, coercion, nesting, invalid basis and oversized bodies. It
forwards canonical JSON to the fixed TariffShield endpoint without cookies,
credentials, caller headers, query parameters, caching, retries or another endpoint.
It bounds input to 16 KiB/five seconds and the gateway response to 64 KiB with a
twenty-second total transport deadline. Errors and failed HTTP success states
return a fresh number-free response. It stores and logs no input declarations.
Outbound redirects use Workers-supported manual mode and every 3xx response is
refused. The live Pages configuration was read on October 6: compatibility date
`2026-08-08`, no flags. Local runtime verification targets that existing setting;
the pinned workerd cannot certify a new October 6 compatibility date.

The paired app candidate validates the same request and arithmetic, checks real
source admission before transport and reacquires it before publishing positive
JSON. Missing runtime configuration, changed sources or expired evidence cannot
produce a current public result. Its original signed scope and expiry are unchanged.

Controlled Node tests cover wire and failure behavior. The app's test executes a
byte copy of this candidate's actual browser parser on its gateway output. Local
Cloudflare packaging/runtime checks, CI, independent review, genuine source/owner
admission, reviewed deployment and live positive/negative/desktop/mobile parity
are separate gates. None is implied by mock fixtures or a merged historical PR.

Release the reviewed app endpoint and verify its admission before releasing this
paired website candidate. If the endpoint is unavailable, the relay returns no
numbers. Do not restore direct numeric fallback to make availability appear green.
