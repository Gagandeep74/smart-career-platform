from backend.nlp_engine.parser import extract_structured_resume


def test_extract_structured_resume_sections_and_contact():
    result = extract_structured_resume(
        """Jane Doe
        jane@example.com | Berlin, Germany
        EXPERIENCE
        Backend Engineer at Acme
        - Built APIs
        EDUCATION
        BSc Computer Science - State University
        PROJECTS
        Career platform
        """
    )
    assert result["email"] == "jane@example.com"
    assert result["location"] == "Berlin, Germany"
    assert result["experience"][0]["role"] == "Backend Engineer"
    assert result["experience"][0]["company"] == "Acme"
    assert result["experience"][0]["bullets"].strip() == "Built APIs"
    assert result["education"][0]["degree"] == "BSc Computer Science"
    assert result["projects"] == ["Career platform"]
