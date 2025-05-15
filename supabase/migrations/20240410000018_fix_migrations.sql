-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_personal_records_updated_at ON personal_records;
DROP TRIGGER IF EXISTS update_calorie_tracking_updated_at ON calorie_tracking;
DROP TRIGGER IF EXISTS update_water_tracking_updated_at ON water_tracking;
DROP TRIGGER IF EXISTS update_mood_tracking_updated_at ON mood_tracking;
DROP TRIGGER IF EXISTS update_workout_logs_updated_at ON workout_logs;
DROP TRIGGER IF EXISTS update_mental_session_logs_updated_at ON mental_session_logs;

-- Recreate triggers
CREATE TRIGGER update_personal_records_updated_at
    BEFORE UPDATE ON personal_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calorie_tracking_updated_at
    BEFORE UPDATE ON calorie_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_water_tracking_updated_at
    BEFORE UPDATE ON water_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mood_tracking_updated_at
    BEFORE UPDATE ON mood_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_logs_updated_at
    BEFORE UPDATE ON workout_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mental_session_logs_updated_at
    BEFORE UPDATE ON mental_session_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 