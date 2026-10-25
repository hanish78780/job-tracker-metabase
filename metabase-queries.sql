-- Question 1: Opportunity stages (not completed-application totals).
SELECT status, opportunities FROM analytics.status_counts
ORDER BY opportunities DESC, status;

-- Question 2: Actual application dates in the source snapshot.
SELECT date_trunc('week', applied_on)::date AS week,
       count(*) AS dated_opportunity_records,
       count(DISTINCT employer_key) AS employers
FROM analytics.opportunities WHERE applied_on IS NOT NULL
GROUP BY week ORDER BY week;

-- Question 3: Review queue. These are recorded follow-up dates, not an
-- instruction to resend. Check original email threads before any action.
SELECT role_family, mode, status, followup_on, opportunities
FROM analytics.followup_queue ORDER BY followup_on, role_family;

-- Question 4: Missing source dates, kept visible rather than invented.
SELECT count(*) FILTER (WHERE applied_on IS NULL) AS without_applied_date,
       count(*) FILTER (WHERE checked_on IS NULL) AS without_checked_date,
       count(*) AS total_opportunities
FROM analytics.opportunities;
