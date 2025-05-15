-- First, create a temporary table to store the latest streak data for each user
CREATE TEMP TABLE latest_streaks AS
WITH ranked_streaks AS (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) as rn
    FROM betteru_streaks
)
SELECT * FROM ranked_streaks WHERE rn = 1;

-- Delete all existing streak data
DELETE FROM betteru_streaks;

-- Reinsert the latest streak data for each user
INSERT INTO betteru_streaks (
    id,
    user_id,
    current_streak,
    longest_streak,
    last_completed_date,
    created_at,
    updated_at
)
SELECT 
    id,
    user_id,
    current_streak,
    longest_streak,
    last_completed_date,
    created_at,
    updated_at
FROM latest_streaks;

-- Drop the temporary table
DROP TABLE latest_streaks;

-- Now add the unique constraint
ALTER TABLE betteru_streaks
    ADD CONSTRAINT betteru_streaks_user_id_key UNIQUE (user_id); 