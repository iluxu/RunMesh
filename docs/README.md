# RunMesh Documentation Website

This is the official documentation website for RunMesh - an OpenAI-first JS/TS framework for building agentic applications.

## 🚀 Deploy to Cloudflare Pages

### Quick Deploy

1. **Fork or clone this repository**

   ```bash
   git clone https://github.com/iluxu/RunMesh.git
   cd RunMesh
   ```

2. **Push to GitHub** (if not already there)

   ```bash
   git add .
   git commit -m "Add documentation website"
   git push origin main
   ```

3. **Deploy to Cloudflare Pages**
   - Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Go to **Pages** → **Create a project**
   - Connect your GitHub account
   - Select the **RunMesh** repository
   - Configure build settings:
     - **Build command:** Leave empty (static site)
     - **Build output directory:** `/` (root directory)
     - **Root directory:** `/docs` (or wherever you place these files)
   - Click **Save and Deploy**

### Alternative: Direct Upload

If you don't want to use Git integration:

1. Go to Cloudflare Pages
2. Click **Create a project** → **Direct Upload**
3. Upload the `index.html` file (and any other assets)
4. Your site will be live instantly!

## 📁 File Structure

```
docs/
├── index.html          # Main documentation page
├── api-docs.html       # API reference page
├── README.md           # This file
└── _redirects          # Optional: Cloudflare redirects (if needed)
```

## 🎨 Customization

### Colors

The website uses CSS custom properties (variables) for theming. Edit these in the `:root` section of `index.html`:

```css
:root {
  --primary: #00ff88; /* Primary accent color */
  --secondary: #0088ff; /* Secondary accent color */
  --dark: #0a0e1a; /* Dark background */
  --accent: #ff0080; /* Accent color for alerts */
}
```

### Content

All content is contained in `index.html`. Key sections:

- **Hero**: Main title and call-to-action
- **Features**: Feature grid with icons
- **Quickstart**: Code example
- **Installation**: Package installation commands
- **Packages**: Framework package descriptions
- **License**: License information
- **Demo**: Mimi8 Studio walkthrough

The API reference lives in `api-docs.html`.
## 🌐 Custom Domain

To use a custom domain:

1. In Cloudflare Pages, go to your project
2. Click **Custom domains**
3. Add your domain (e.g., `docs.runmesh.dev`)
4. Follow Cloudflare's instructions to update your DNS

## 🔧 Local Development

Simply open `index.html` in a browser, or use a local server:

```bash
# Python
python -m http.server 8000

# Node.js (using npx)
npx serve

# PHP
php -S localhost:8000
```

Then visit `http://localhost:8000`

## 📦 Zero Dependencies

This website has:

- ✅ Zero build tools
- ✅ Zero npm packages
- ✅ Zero configuration
- ✅ Pure HTML, CSS, and vanilla JavaScript
- ✅ Fonts loaded from Google Fonts CDN

## 🎯 Features

- **Responsive Design**: Works perfectly on mobile, tablet, and desktop
- **Smooth Animations**: CSS animations for modern feel
- **Syntax Highlighting**: Custom code highlighting
- **Interactive Elements**: Click-to-copy install commands
- **SEO Optimized**: Proper meta tags and semantic HTML
- **Fast Loading**: Minimal external dependencies

## 📝 License

The documentation website code is provided as-is. RunMesh framework itself is licensed under Business Source License 1.1 (BSL 1.1).

---

Need help? Open an issue on [GitHub](https://github.com/iluxu/RunMesh/issues).
