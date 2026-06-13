# Resources Hub

A simple static website that collects all created resource websites in one place.

## Pages

- `index.html` — Home page with a long project description in Arabic, French and English.
- `websites.html` — French page that lists all resource websites from `data/websites.json` with a search bar.
- `about.html` — French about page.

## Data files

- `data/websites.json` contains the websites shown in the catalogue.
- `data/home-descriptions.json` contains the multilingual home description.

## Add a new website

Open `data/websites.json` and add a new object:

```json
{
  "id": "new-project-id",
  "name": "Project Name",
  "description": "Short description of the website.",
  "link": "https://example.netlify.app/",
  "repo": "https://github.com/user/repo",
  "owner": "Amr Slama",
  "category": "Category",
  "status": "Disponible"
}
```

## Test locally

From the project folder, run:

```bash
python -m http.server 3000
```

Then open:

```txt
http://localhost:3000
```

## Deploy to Netlify

Drag and drop the full folder into Netlify, or connect the GitHub repo. The project is static and needs no build command.
