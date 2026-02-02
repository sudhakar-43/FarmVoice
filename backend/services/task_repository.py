import sqlite3
import json
from datetime import datetime, timedelta
import os
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "tasks.db")

class TaskRepository:
    def __init__(self):
        # Ensure data directory exists
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        self._init_db()

    def _get_conn(self):
        return sqlite3.connect(DB_PATH)

    def _init_db(self):
        conn = self._get_conn()
        cursor = conn.cursor()
        
        # Create tasks table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                crop_name TEXT NOT NULL,
                task_name TEXT NOT NULL,
                task_type TEXT NOT NULL,
                status TEXT DEFAULT 'pending', -- pending, completed
                due_date TEXT,
                priority TEXT DEFAULT 'MEDIUM',
                created_at TEXT
            )
        """)
        
        conn.commit()
        conn.close()

    def get_tasks_by_user(self, user_id: str, crop_name: Optional[str] = None) -> List[Dict[str, Any]]:
        conn = self._get_conn()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        if crop_name:
            cursor.execute("SELECT * FROM tasks WHERE user_id = ? AND crop_name = ? ORDER BY due_date ASC", (user_id, crop_name))
        else:
            cursor.execute("SELECT * FROM tasks WHERE user_id = ? ORDER BY due_date ASC", (user_id,))
            
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]

    def create_batch_tasks(self, tasks: List[Dict[str, Any]]):
        conn = self._get_conn()
        cursor = conn.cursor()
        
        for task in tasks:
            cursor.execute("""
                INSERT OR IGNORE INTO tasks (id, user_id, crop_name, task_name, task_type, status, due_date, priority, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                task['id'],
                task['user_id'],
                task['crop_name'],
                task['task_name'],
                task['task_type'],
                task.get('status', 'pending'),
                task['due_date'],
                task.get('priority', 'MEDIUM'),
                datetime.now().isoformat()
            ))
            
        conn.commit()
        conn.close()

    def update_task_status(self, task_id: str, status: str) -> bool:
        conn = self._get_conn()
        cursor = conn.cursor()
        
        cursor.execute("UPDATE tasks SET status = ? WHERE id = ?", (status, task_id))
        rows_affected = cursor.rowcount
        
        conn.commit()
        conn.close()
        return rows_affected > 0

    def get_health_score(self, user_id: str) -> Dict[str, Any]:
        """
        Calculate health score based on task completion ratio.
        """
        conn = self._get_conn()
        cursor = conn.cursor()
        
        # Get total tasks count
        cursor.execute("SELECT COUNT(*) FROM tasks WHERE user_id = ?", (user_id,))
        total_tasks = cursor.fetchone()[0]
        
        if total_tasks == 0:
            conn.close()
            return {"score": 0, "status": "Not Started", "growth": "N/A", "risks": "N/A", "details": "Complete tasks to improve health"}
            
        # Get completed tasks count
        cursor.execute("SELECT COUNT(*) FROM tasks WHERE user_id = ? AND status = 'completed'", (user_id,))
        completed_tasks = cursor.fetchone()[0]
        
        conn.close()
        
        # Calculate score (Mock logic using real data: Base 50 + (Completion % * 50))
        # If you are up to date, score is high.
        
        # Better logic: Check if there are overdue tasks
        # For simplicity in this demo: straight percentage of TOTAL tasks might be discouraging if new tasks are added.
        # Let's do: Percentage of tasks DUE TODAY or BEFORE that are completed.
        
        # Re-querying for thoughtful logic
        return self._calculate_smart_score(user_id)

    def _calculate_smart_score(self, user_id: str) -> Dict[str, Any]:
        conn = self._get_conn()
        cursor = conn.cursor()
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Fetch all tasks due on or before today
        cursor.execute("SELECT status FROM tasks WHERE user_id = ? AND date(due_date) <= date(?)", (user_id, today))
        rows = cursor.fetchall()
        
        conn.close()
        
        if not rows:
             return {"score": 0, "status": "Not Started", "growth": "N/A", "risks": "N/A"}

        total_due = len(rows)
        completed_due = sum(1 for r in rows if r[0] == 'completed')
        
        if total_due == 0:
             return {"score": 0, "status": "Not Started", "growth": "N/A", "risks": "N/A"}
             
        ratio = completed_due / total_due
        score = int(ratio * 100)
        
        # Determine labels
        if score >= 80:
            status = "Optimal"
            growth = "Vigorous"
            risks = "Minimal"
        elif score >= 50:
            status = "Good"
            growth = "Stable"
            risks = "Low"
        else:
            status = "Needs Attention"
            growth = "Slow"
            risks = "Moderate"
            
        return {
            "score": score,
            "status": status,
            "growth": growth,
            "risks": risks
        }

task_repo = TaskRepository()
