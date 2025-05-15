-- Create a function to sync streak data
CREATE OR REPLACE FUNCTION sync_streak_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Update profiles table when betteru_streaks is updated
    IF TG_TABLE_NAME = 'betteru_streaks' THEN
        UPDATE profiles
        SET streak = NEW.current_streak,
            longest_streak = NEW.longest_streak,
            last_streak_update = NEW.last_completed_date
        WHERE id = NEW.user_id;
    END IF;

    -- Update betteru_streaks table when profiles is updated
    IF TG_TABLE_NAME = 'profiles' THEN
        UPDATE betteru_streaks
        SET current_streak = NEW.streak,
            longest_streak = NEW.longest_streak,
            last_completed_date = NEW.last_streak_update,
            updated_at = NOW()
        WHERE user_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for streak synchronization
DROP TRIGGER IF EXISTS sync_streak_on_betteru_streaks_update ON betteru_streaks;
CREATE TRIGGER sync_streak_on_betteru_streaks_update
    AFTER INSERT OR UPDATE ON betteru_streaks
    FOR EACH ROW
    EXECUTE FUNCTION sync_streak_data();

DROP TRIGGER IF EXISTS sync_streak_on_profiles_update ON profiles;
CREATE TRIGGER sync_streak_on_profiles_update
    AFTER INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_streak_data();

-- Ensure both tables have the same data
WITH latest_streaks AS (
    SELECT DISTINCT ON (user_id)
        user_id,
        current_streak,
        longest_streak,
        last_completed_date
    FROM betteru_streaks
    ORDER BY user_id, updated_at DESC
)
UPDATE profiles p
SET streak = s.current_streak,
    longest_streak = s.longest_streak,
    last_streak_update = s.last_completed_date
FROM latest_streaks s
WHERE p.id = s.user_id; 