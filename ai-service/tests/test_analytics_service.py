from services.analytics_service import AnalyticsService


def test_compute_trending_counts_correctly():
    svc = AnalyticsService()
    job_skills = [["Python", "ML"], ["Python", "FastAPI"], ["React"]]
    result = svc.compute_trending(job_skills)

    skills = [r["skill"] for r in result]
    assert result[0]["skill"] == "Python"   # most common
    assert result[0]["count"] == 2
    assert "React" in skills


def test_compute_trending_respects_top_n():
    svc = AnalyticsService()
    job_skills = [[f"Skill{i}"] for i in range(20)]
    result = svc.compute_trending(job_skills, top_n=5)
    assert len(result) == 5


def test_is_trending_flag():
    svc = AnalyticsService()
    result = svc.compute_trending([["Python", "ML"], ["Python"]])
    python = next(r for r in result if r["skill"] == "Python")
    assert python["is_trending"] is True

    ml = next(r for r in result if r["skill"] == "ML")
    assert ml["is_trending"] is False  # appears only once
