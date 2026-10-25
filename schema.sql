CREATE SCHEMA IF NOT EXISTS analytics;
CREATE TABLE IF NOT EXISTS analytics.opportunities (
  record_id text PRIMARY KEY,
  employer_key text NOT NULL,
  role_family text NOT NULL,
  mode text NOT NULL,
  status text NOT NULL,
  applied_on date,
  followup_on date,
  checked_on date
);
CREATE OR REPLACE VIEW analytics.status_counts AS
SELECT status, count(*)::integer AS opportunities FROM analytics.opportunities GROUP BY status;
CREATE OR REPLACE VIEW analytics.followup_queue AS
SELECT role_family, mode, status, followup_on, count(*)::integer AS opportunities
FROM analytics.opportunities
WHERE followup_on IS NOT NULL AND status IN ('Email sent','Inquiry sent','Form confirmed')
GROUP BY role_family, mode, status, followup_on;
