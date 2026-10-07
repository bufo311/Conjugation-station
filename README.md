# Conjugation Station 🇪🇸

Fast, context-rich Spanish verb conjugation and vocabulary trainer built with React, TypeScript, Tailwind CSS, and Vite.

- **100% Client-Side & Offline**: No backend or database required; runs entirely in the browser using `localStorage`.
- **Adaptive Pyramid Progression**: Mastery-gated layers for Verbs (12/layer), Vocab Core 500 (25/layer), and Frases (15/layer). Automatically unlocks the next layer at 80% mastery (Leitner Level 3+).
- **Leitner Spaced Repetition (SRS)**: 5-level interval queue prioritizing due reviews before new material.
- **Cross-Device Sync**: Transfer progress across phone, tablet, and desktop via instant 1-click sync link or JSON export/import.
- **Voice Pronunciation**: Offline Web Speech API speech synthesis for verbs, sentences, and vocabulary.

---

## 🚀 How to Push to GitHub & Deploy on GitHub Pages

### 1. Create a New Repository on GitHub
1. Go to [github.com/new](https://github.com/new).
2. Name your repository (for example: `conjugation-station`).
3. Leave it **Public** (required for free GitHub Pages).
4. Do **not** initialize with a README or .gitignore (this project already has them).
5. Click **Create repository**.

### 2. Push Your Code to GitHub
Run the following commands in your terminal:

```bash
# Add your GitHub repository as remote origin (replace YOUR-USERNAME with your GitHub username):
git remote add origin https://github.com/YOUR-USERNAME/conjugation-station.git

# Push to the main branch:
git push -u origin main
```

*(If you use GitHub CLI: `gh repo create conjugation-station --public --source=. --push`)*

### 3. Enable GitHub Pages (Automated Deploy)
1. On GitHub, navigate to your repository's **Settings** tab.
2. In the left sidebar, click on **Pages** (under the "Code and automation" section).
3. Under **Build and deployment > Source**, select **GitHub Actions**.
4. That's it! The included `.github/workflows/deploy.yml` workflow will automatically build the static bundle and deploy it.
5. In ~1 minute, your site will be live at:
   `https://YOUR-USERNAME.github.io/conjugation-station/`

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build production bundle
npm run build
```
