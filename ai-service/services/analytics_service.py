from collections import Counter

class AnalyticsService:
    def compute_trending(self, job_skills: list[list[str]], top_n: int=15) -> list[dict]:
        counter = Counter()
        for skills in job_skills:
            for skill in skills:
                if skill.strip():
                    counter[skill.strip()]+=1
        
        total = sum(counter.values()) or 1
        top = counter.most_common(top_n)

        return [
            {
                "skill": skill,
                "count": count,
                "percentage": round(count/total * 100, 1), 
                "is_trending": count >= 2,
            }
            for skill, count in top
        ]