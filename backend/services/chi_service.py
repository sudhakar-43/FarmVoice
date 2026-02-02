"""
Crop Health Index (CHI) and Daily Task Score (DTS) Service

Enterprise-grade service for calculating and managing:
- Daily Task Score (DTS): 0-100, resets daily, task completion tracking
- Crop Health Index (CHI): 0-100, persistent, slow-changing health metric
- Growth Status: Derived from CHI ranges
- Risk Level: Derived from missed tasks, disease, weather
- New User Grace Period: 24-hour protection with calm onboarding
"""

import logging
from datetime import datetime, date, timedelta, timezone
from typing import Dict, Any, Optional, Tuple
from dataclasses import dataclass

logger = logging.getLogger(__name__)


# ============================================================
# NEW USER GRACE PERIOD CONSTANTS
# ============================================================
GRACE_PERIOD_HOURS = 24
NEW_USER_MAX_CHI_INCREASE = 0.5  # Max +0.5% during grace period
NEW_USER_CHI_DECREASE = 0.0      # No decrease during grace period


@dataclass
class DTSData:
    """Daily Task Score data structure."""
    date: str
    completed_tasks: int
    total_tasks: int
    dts_score: int  # 0-100
    

@dataclass
class CHIData:
    """Crop Health Index data structure."""
    chi_score: float  # 0-100
    trend: str  # "up", "down", "stable", "hidden" (for new users)
    trend_delta: float  # Last change amount
    growth_status: str  # "Stunted", "Moderate", "Healthy", "Optimal", "Evaluating"
    risk_level: str  # "Low", "Medium", "High", "Unknown"
    explanation: str  # Human-readable explanation
    is_new_user: bool  # True if within 24-hour grace period
    grace_period_ends_at: Optional[str]  # ISO timestamp when grace period ends


class CHIService:
    """
    Service for managing Crop Health Index and Daily Task Score.
    
    Design Principles:
    - Tasks NEVER directly modify CHI
    - DTS accumulates during the day (each task = +10 DTS)
    - CHI changes only at end-of-day based on DTS thresholds
    - New users get 24-hour grace period with CHI protection
    - All calculations are transparent and explainable
    """
    
    TASKS_PER_DAY = 10
    DTS_PER_TASK = 10
    INITIAL_CHI = 50.0
    
    # CHI change rules based on end-of-day DTS
    CHI_DELTA_RULES = [
        (100, 100, 1.0),   # DTS 100 -> +1.0%
        (70, 99, 0.5),     # DTS 70-99 -> +0.5%
        (40, 69, 0.0),     # DTS 40-69 -> no change
        (0, 39, -1.0),     # DTS 0-39 -> -1.0%
    ]
    
    # Growth status thresholds based on CHI
    GROWTH_THRESHOLDS = [
        (90, 100, "Optimal"),
        (70, 89, "Healthy"),
        (40, 69, "Moderate"),
        (0, 39, "Stunted"),
    ]
    
    def __init__(self):
        # In-memory cache for demo; production would use Supabase
        self._chi_cache: Dict[str, float] = {}
        self._dts_cache: Dict[str, Dict[str, int]] = {}
    
    # ============================================================
    # NEW USER DETECTION (TIME-BASED)
    # ============================================================
    
    def is_new_user(self, created_at: Optional[datetime]) -> bool:
        """
        Determine if user is within 24-hour grace period.
        
        A user is NEW if: current_time - account_created_at < 24 hours
        Uses server time (UTC) for validation.
        
        Args:
            created_at: User account creation timestamp (must be timezone-aware)
            
        Returns:
            True if account age < 24 hours, False otherwise
        """
        if created_at is None:
            return False
        
        # Ensure we use UTC for consistency
        now = datetime.now(timezone.utc)
        
        # Make created_at timezone-aware if it isn't
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        
        account_age = now - created_at
        return account_age < timedelta(hours=GRACE_PERIOD_HOURS)
    
    def get_grace_period_end(self, created_at: Optional[datetime]) -> Optional[str]:
        """Get ISO timestamp when grace period ends."""
        if created_at is None:
            return None
        
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
            
        grace_period_end = created_at + timedelta(hours=GRACE_PERIOD_HOURS)
        return grace_period_end.isoformat()
    
    # ============================================================
    # CORE DTS/CHI CALCULATIONS
    # ============================================================
    
    def calculate_dts(self, completed_tasks: int, total_tasks: int = 10) -> int:
        """
        Calculate Daily Task Score.
        
        Args:
            completed_tasks: Number of completed tasks today
            total_tasks: Total tasks for the day (default 10)
            
        Returns:
            DTS score (0-100)
        """
        if total_tasks == 0:
            return 0
        return min(100, completed_tasks * self.DTS_PER_TASK)
    
    def get_dts_data(self, user_id: str, completed_tasks: int, total_tasks: int = 10) -> DTSData:
        """Get current DTS data for display."""
        today = date.today().isoformat()
        dts_score = self.calculate_dts(completed_tasks, total_tasks)
        
        return DTSData(
            date=today,
            completed_tasks=completed_tasks,
            total_tasks=total_tasks,
            dts_score=dts_score
        )
    
    def calculate_chi_delta(
        self, 
        dts_score: int, 
        is_new_user: bool = False
    ) -> float:
        """
        Calculate CHI change based on end-of-day DTS.
        
        For new users (< 24h):
        - Max increase capped at +0.5%
        - No decrease allowed (returns 0.0 for negative deltas)
        
        Args:
            dts_score: Final DTS for the day (0-100)
            is_new_user: True if user is within grace period
            
        Returns:
            CHI delta (can be negative for normal users, never negative for new users)
        """
        # Find base delta from rules
        base_delta = 0.0
        for min_dts, max_dts, delta in self.CHI_DELTA_RULES:
            if min_dts <= dts_score <= max_dts:
                base_delta = delta
                break
        
        # Apply grace period restrictions
        if is_new_user:
            if base_delta < 0:
                # No CHI decrease during grace period
                return 0.0
            else:
                # Cap CHI increase at +0.5%
                return min(base_delta, NEW_USER_MAX_CHI_INCREASE)
        
        return base_delta
    
    def get_growth_status(self, chi_score: float, is_new_user: bool = False) -> str:
        """
        Derive growth status from CHI score.
        
        For new users: Returns "Evaluating"
        For normal users:
            CHI 0-39   -> Stunted
            CHI 40-69  -> Moderate
            CHI 70-89  -> Healthy
            CHI 90-100 -> Optimal
        """
        if is_new_user:
            return "Evaluating"
        
        for min_chi, max_chi, status in self.GROWTH_THRESHOLDS:
            if min_chi <= chi_score <= max_chi:
                return status
        return "Moderate"
    
    def calculate_risk_level(
        self, 
        missed_tasks: int, 
        disease_risk: str = "low",
        weather_stress: bool = False,
        is_new_user: bool = False
    ) -> str:
        """
        Calculate risk level from multiple factors.
        
        For new users: Returns "Unknown"
        For normal users, risk is derived from:
        - Missed tasks (>= 4 = high risk factor)
        - Disease scan outcomes
        - Weather stress indicators
        
        Returns: "Low", "Medium", "High", or "Unknown"
        """
        if is_new_user:
            return "Unknown"
        
        risk_factors = 0
        
        # Missed tasks contribution
        if missed_tasks >= 4:
            risk_factors += 2
        elif missed_tasks >= 2:
            risk_factors += 1
            
        # Disease risk contribution
        if disease_risk == "high":
            risk_factors += 2
        elif disease_risk == "medium":
            risk_factors += 1
            
        # Weather stress contribution
        if weather_stress:
            risk_factors += 1
        
        # Map risk factors to level
        if risk_factors >= 3:
            return "High"
        elif risk_factors >= 1:
            return "Medium"
        return "Low"
    
    # ============================================================
    # MAIN API METHOD
    # ============================================================
    
    def get_chi_data(
        self,
        user_id: str,
        completed_tasks: int,
        total_tasks: int = 10,
        current_chi: Optional[float] = None,
        previous_chi: Optional[float] = None,
        disease_risk: str = "low",
        weather_stress: bool = False,
        created_at: Optional[datetime] = None
    ) -> CHIData:
        """
        Get comprehensive CHI data for display.
        
        This is the main method called by the frontend.
        It does NOT modify CHI - only calculates display values.
        
        For new users (< 24h account age):
        - CHI shown as "Baseline Health" at 50%
        - Trend arrows hidden
        - Growth status: "Evaluating"
        - Risk level: "Unknown"
        - CHI penalties disabled
        """
        # Determine if user is in grace period
        user_is_new = self.is_new_user(created_at)
        grace_period_end = self.get_grace_period_end(created_at) if user_is_new else None
        
        # Use provided CHI or default (always 50% baseline for new users)
        chi_score = current_chi if current_chi is not None else self.INITIAL_CHI
        
        # Calculate DTS for display
        dts_score = self.calculate_dts(completed_tasks, total_tasks)
        
        # Calculate what the CHI delta WOULD be at end of day
        projected_delta = self.calculate_chi_delta(dts_score, is_new_user=user_is_new)
        
        # Determine trend (hidden for new users)
        if user_is_new:
            trend = "hidden"
            trend_delta = 0.0
        elif previous_chi is not None:
            actual_delta = chi_score - previous_chi
            if actual_delta > 0:
                trend = "up"
            elif actual_delta < 0:
                trend = "down"
            else:
                trend = "stable"
            trend_delta = actual_delta
        else:
            trend = "stable"
            trend_delta = 0.0
        
        # Derive growth status
        growth_status = self.get_growth_status(chi_score, is_new_user=user_is_new)
        
        # Calculate risk level
        missed_tasks = total_tasks - completed_tasks
        risk_level = self.calculate_risk_level(
            missed_tasks, disease_risk, weather_stress, is_new_user=user_is_new
        )
        
        # Generate explanation text
        explanation = self._generate_explanation(
            completed_tasks, total_tasks, dts_score, projected_delta, is_new_user=user_is_new
        )
        
        return CHIData(
            chi_score=chi_score,
            trend=trend,
            trend_delta=trend_delta,
            growth_status=growth_status,
            risk_level=risk_level,
            explanation=explanation,
            is_new_user=user_is_new,
            grace_period_ends_at=grace_period_end
        )
    
    def _generate_explanation(
        self,
        completed: int,
        total: int,
        dts: int,
        projected_delta: float,
        is_new_user: bool = False
    ) -> str:
        """Generate human-readable explanation for CHI card."""
        
        # New user onboarding tone
        if is_new_user:
            if completed == 0:
                return "Baseline value. Complete tasks to build your Daily Task Score."
            elif completed == total:
                return f"Excellent start! All {total} tasks completed. Health tracking will begin soon."
            else:
                return f"{completed} of {total} tasks completed. Health tracking begins after initial activity."
        
        # Normal user messaging
        if completed == total:
            return f"All {total} tasks completed. CHI will increase by +{projected_delta}% tomorrow."
        elif completed == 0:
            return f"No tasks completed yet. Complete tasks to improve your score."
        else:
            remaining = total - completed
            if projected_delta > 0:
                return f"{completed} of {total} tasks completed. Projected: +{projected_delta}% CHI"
            elif projected_delta < 0:
                return f"{completed} of {total} tasks completed. Complete {remaining} more to avoid CHI decline."
            else:
                return f"{completed} of {total} tasks completed. CHI will remain stable."
    
    def apply_end_of_day_chi_update(
        self,
        user_id: str,
        current_chi: float,
        dts_score: int,
        created_at: Optional[datetime] = None
    ) -> Tuple[float, float]:
        """
        Apply end-of-day CHI update based on DTS.
        
        This would be called by a scheduled job, not directly by task completion.
        Respects grace period restrictions.
        
        Returns:
            Tuple of (new_chi, delta_applied)
        """
        user_is_new = self.is_new_user(created_at)
        delta = self.calculate_chi_delta(dts_score, is_new_user=user_is_new)
        new_chi = max(0, min(100, current_chi + delta))
        
        logger.info(
            f"CHI Update for user {user_id}: "
            f"DTS={dts_score}, Delta={delta:+.1f}%, "
            f"CHI: {current_chi:.1f}% -> {new_chi:.1f}% "
            f"(new_user={user_is_new})"
        )
        
        return new_chi, delta


# Singleton instance
chi_service = CHIService()
