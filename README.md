# Portfolio

Plain HTML/CSS/JS. No build step.

## Preview locally

```bash
python3 -m http.server 8000
```

Open http://localhost:8000. (Opening `index.html` directly won't load `projects.json`.)

## Add a project

1. Put images in `images/` (JPG/PNG/WebP, ~1600px wide, 16:10 looks best).
2. Add an entry to `projects.json`:

```json
{
  "title": "My Project",
  "year": "2026",
  "summary": "One line shown on the card.",
  "description": "Longer text shown when the card is clicked.\n\nBlank line = new paragraph.",
  "tags": ["Python", "ROS 2"],
  "images": ["images/my-project-1.jpg", "images/my-project-2.jpg"],
  "links": { "github": "https://github.com/...", "demo": "" }
}
```

The first image is the card thumbnail. More images show as thumbnails in the popup. Empty links are hidden.

## Edit personal info

Search `index.html` for `EDIT`. Covers: name, tagline, quick facts, the scrolling
"Worked with" list, About text, CV timeline entries and contact links.

## CV

Put your CV in this folder as `cv.pdf`. The "Download PDF" button links to it.
The timeline entries in the CV section are plain HTML: copy an `<li>…</li>` block to add one.

## Deploy to GitHub Pages

1. Create a repo on GitHub named `<your-username>.github.io` (public).
2. In this folder:
   ```bash
   git init
   git add .
   git commit -m "Initial portfolio"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-username>.github.io.git
   git push -u origin main
   ```
3. Repo → Settings → Pages → Source: `Deploy from a branch`, branch `main`, folder `/ (root)`.
4. Site is live at `https://<your-username>.github.io` in 1–2 minutes.

To update later: edit files, then `git add . && git commit -m "Update" && git push`.
