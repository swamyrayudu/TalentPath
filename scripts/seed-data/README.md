# Roadmap seed data

Source content for the five in-depth roadmaps added on 2026-08-28. Each file
holds an array of roadmaps in the shape the `roadmaps` / `roadmap_steps` tables
expect:

```jsonc
{
  "title": "…",
  "description": "…",
  "category": "ai-ml",        // roadmap_category enum
  "difficulty": "advanced",
  "estimatedTime": "8-10 months",
  "steps": [
    { "title": "…", "description": "…", "resources": "https://…" }
  ]
}
```

| File | Roadmaps | Steps |
| --- | --- | --- |
| `roadmaps_1.json` | AI & Machine Learning Engineering, Data Engineering | 32, 29 |
| `roadmaps_2.json` | Cybersecurity Engineering, Mobile Development with React Native | 31, 29 |
| `roadmaps_3.json` | System Design & Scalability | 32 |

These were loaded through a temporary `POST /api/roadmap-seed` route that has
since been removed. Keep the files here so the content is version-controlled and
a roadmap can be corrected or re-seeded without rewriting it from scratch — the
database is the only other copy.

Every `resources` URL was checked for a 200 response at the time of writing. If
you re-seed, re-check them: documentation links rot.
