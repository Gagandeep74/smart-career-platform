import pandas as pd
from typing import List, Dict

def suggest_courses(missing_skills: List[str], course_db: pd.DataFrame = None, role: str = None, core_skills: List[str] = None) -> List[Dict]:
    """
    Module 9: Personalized Course & Project Recommendation
    Generates a sequenced, multi-stage learning path for each missing skill,
    concluding with a single Capstone project.
    """
    recommendations = []
    
    import urllib.parse
    
    for skill in missing_skills:
        safe_skill = urllib.parse.quote_plus(skill)
        
        # Phase 1: Foundation
        recommendations.append({
            "skill": skill,
            "title": f"Core Concepts: Understanding {skill.title()}",
            "difficulty": "Beginner",
            "url": f"https://www.youtube.com/results?search_query={safe_skill}+tutorial+for+beginners+full+course",
            "content_type": "Topic"
        })
        
        # Phase 2: Application
        recommendations.append({
            "skill": skill,
            "title": f"Applied {skill.title()}: Best Practices & Patterns",
            "difficulty": "Intermediate",
            "url": f"https://www.youtube.com/results?search_query={safe_skill}+advanced+best+practices+architecture",
            "content_type": "Lab"
        })

        # Phase 3: Mini Project
        recommendations.append({
            "skill": skill,
            "title": f"Mini-Project: Interactive {skill.title()} implementation",
            "difficulty": "Advanced",
            "url": f"https://www.youtube.com/results?search_query=build+project+with+{safe_skill}",
            "content_type": "Project"
        })
            
    # Phase 4: Capstone
    if role:
        safe_role = urllib.parse.quote_plus(role)
        skills_str = ", ".join(core_skills[:4]) + "..." if core_skills else "core domain tools"
        recommendations.append({
            "skill": "Capstone",
            "title": f"Master the {role} Path: Build a production-ready application integrating {skills_str}",
            "difficulty": "Expert",
            "url": f"https://www.youtube.com/results?search_query=how+to+build+{safe_role}+portfolio+project",
            "content_type": "Domain Project"
        })

    return recommendations
