/**
 * Business Predictions - ML/AI parameters and prediction configurations
 *
 * These constants define parameters for machine learning models,
 * prediction algorithms, and confidence intervals.
 */

// Prediction model parameters
export const PREDICTION_PARAMETERS = {
  CONFIDENCE_THRESHOLD: 0.6, // Minimum confidence for predictions
  HIGH_CONFIDENCE_THRESHOLD: 0.8, // High confidence threshold
  PREDICTION_HORIZON_HOURS: 48, // Default prediction horizon
  MODEL_ACCURACY_THRESHOLD: 0.75, // Minimum model accuracy required
} as const

// ML model configuration
export const ML_CONFIG = {
  TRAINING_WINDOW_DAYS: 30, // Days of data for model training
  FEATURE_IMPORTANCE_THRESHOLD: 0.1, // Minimum feature importance
  CROSS_VALIDATION_FOLDS: 5, // Number of CV folds
  MAX_ITERATIONS: 1000, // Maximum training iterations
} as const

// Seasonal analysis parameters
export const SEASONAL_ANALYSIS = {
  SEASONAL_WINDOW_WEEKS: 12, // Weeks of data for seasonal analysis
  TREND_SIGNIFICANCE_THRESHOLD: 0.05, // P-value for trend significance
  SEASONAL_FACTOR_THRESHOLD: 0.2, // Minimum seasonal factor
  CYCLE_DETECTION_MIN_PERIODS: 3, // Minimum periods for cycle detection
} as const

export type PredictionParameters = typeof PREDICTION_PARAMETERS
export type MlConfig = typeof ML_CONFIG
export type SeasonalAnalysis = typeof SEASONAL_ANALYSIS
