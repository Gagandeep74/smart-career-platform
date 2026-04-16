import pandas as pd
import numpy as np

def calculate_skill_gap(user_skills: list[str], job_required_skills: list[str]) -> dict:
    """
    Module 3: Skill Gap Analysis
    Computes where the user stands relative to job role requirements.
    
    Formula:
    Missing Skills = Job Required Skills - User Extracted Skills
    Match % = (Matched Skills / Required Skills) * 100
    
    Args:
        user_skills (list): The list of parsed skills from Resume.
        job_required_skills (list): The required baseline for the target domain.
        
    Returns:
        dict: A dictionary outputting overlap, gap list, and percentage.
    """
    
    # Standardize formats to lowercase
    user_set = set([skill.lower().strip() for skill in user_skills])
    job_set = set([skill.lower().strip() for skill in job_required_skills])
    
    # NumPy arrays for fast vectorized operations if lists are large
    u_arr = np.array(list(user_set))
    j_arr = np.array(list(job_set))
    
    # Mathematical Set operations
    matched_skills = list(user_set.intersection(job_set))
    missing_skills = list(job_set.difference(user_set))
    
    # Calculate %
    total_required = len(job_set)
    if total_required == 0:
        match_percentage = 100.0  # Safe fallback if job has 0 requirements, technically 100% matched
    else:
        match_percentage = (len(matched_skills) / total_required) * 100.0
        
    # Build the Gap Report via Pandas Series
    gap_series = pd.Series({
        "Total Required": len(job_set),
        "Total User Skills": len(user_set),
        "Total Matched": len(matched_skills),
        "Match Percentage": round(match_percentage, 2)
    })
    
    # Priority logic (Mock): If total gap > 5, list top 5 gaps based on predefined industry weight (not fully implemented)
    priority_list = missing_skills[:10]  # Just taking top 10 as starting point
        
    return {
        "analysis_summary": gap_series.to_dict(),
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "priority_learning": priority_list
    }
