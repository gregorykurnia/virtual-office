# Investment Office report contract v2

Contract version: `investment-office-report@2.0.0`

Schema: `report-contract.v2.schema.json`

Return a single JSON object conforming to the adjacent schema. This is the analyst's content payload; the application will attach trusted owner, app-agent, task, run, generation, and ingestion metadata. Do not invent those identifiers or timestamps.

Use `coverage_status: "limited"` when important data is missing or stale. Use `no_material_update` only when the assigned coverage was completed and no material change was found. Put an explanation in `coverage_explanation` and `data_freshness.explanation` whenever the window or freshness is incomplete.

Facts need source keys. For each source, provide a stable key, a concise title, and a direct URL. Set `published_at` to `null` if the source does not state a publication date. Set `retrieved_at` to `null` unless the runtime supplies a trusted retrieval timestamp. The application will validate source protocols and references before persistence.

Use UTC RFC 3339 timestamps for known coverage instants. Use `null` if the boundary is unknown. Set `market_session_date` only for a verified US market session; do not invent a session for a holiday or incomplete data window. Include only related holdings, ETFs, sectors, and topics that are actually supported by the supplied inputs and report.

The schema checks shape and consistency, not factual truth. Important numerical claims and source quality still require review.
