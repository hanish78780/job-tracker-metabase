-- Actual 25 October deployment uses Metabase's supported CSV upload into
-- private project PostgreSQL. The uploaded model is ID 40 on this instance.
-- Replacing 40 with the newly created model ID makes these reusable elsewhere.
-- The Node importer/analytics schema route is an alternative, not the live route.

-- Snapshot integrity: verified live result 127, 120, 45, 0.
SELECT count(*) AS tracked_opportunities,
       count(DISTINCT employer_key) AS employers,
       count(*) FILTER (WHERE applied_on IS NULL) AS missing_application_date,
       count(*) FILTER (WHERE checked_on IS NULL) AS missing_checked_date
FROM {{#40-opportunities}};

-- Recorded review dates. This is not authorization to send follow-ups.
SELECT role_family, mode, status, followup_on, count(*) AS opportunities
FROM {{#40-opportunities}}
WHERE followup_on IS NOT NULL
  AND status IN ('Email sent', 'Inquiry sent', 'Form confirmed')
GROUP BY role_family, mode, status, followup_on
ORDER BY followup_on, role_family;

-- Actual recorded activity, not successful-delivery claims.
SELECT date_trunc('week', applied_on)::date AS week,
       count(*) AS dated_opportunity_records,
       count(DISTINCT employer_key) AS employers
FROM {{#40-opportunities}}
WHERE applied_on IS NOT NULL
GROUP BY week ORDER BY week;
