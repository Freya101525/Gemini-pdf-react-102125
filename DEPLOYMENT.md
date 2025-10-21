# 🚀 Deployment Guide for Agentic PDF & Prompt Orchestrator

Hello! This guide will walk you through deploying your new web application so you can share it with the world. We'll cover three popular, beginner-friendly options.

## 📋 Before You Begin: Prerequisites

1.  **Node.js**: Make sure you have Node.js installed. You can get it from [nodejs.org](https://nodejs.org/).
2.  **Code Editor**: A good editor like [Visual Studio Code](https://code.visualstudio.com/) will make things easier.
3.  **Git & GitHub**: You'll need Git installed and a [GitHub](https://github.com/) account to host your code.
4.  **Google Gemini API Key**: Your app needs this to work. You can get one from [Google AI Studio](https://ai.google.dev/).

## 🔑 The Most Important Step: Your API Key

Your application needs a Google Gemini API key to function. We must handle this securely and correctly for deployment.

**Never write your API key directly in the code!**

Instead, we use **Environment Variables**. Think of them as secret placeholders that your hosting provider will fill in when it builds and runs your app.

In the application code, we look for a variable named `VITE_API_KEY`. The `VITE_` prefix is a requirement from Vite (the tool that builds our app) to make the variable accessible in the browser.

Each deployment option below has a section on how to set this crucial variable.

## Option 1: Vercel (Recommended for Beginners)

Vercel is a platform designed for fast, easy deployment of web applications.

**Step 1: Push Your Code to GitHub**
- Create a new repository on GitHub.
- In your project folder on your computer, run these commands:
  ```bash
  git init
  git add .
  git commit -m "Initial version of my orchestrator app"
  git branch -M main
  git remote add origin YOUR_GITHUB_REPO_URL
  git push -u origin main
  ```

**Step 2: Deploy on Vercel**
1.  Go to [vercel.com](https://vercel.com/) and sign up using your GitHub account.
2.  On your dashboard, click **"Add New..." -> "Project"**.
3.  Find your GitHub repository in the list and click **"Import"**.
4.  Vercel will automatically detect that it's a Vite project. You don't need to change the build settings.
5.  Expand the **"Environment Variables"** section.
6.  Add a new variable:
    - **Name**: `VITE_API_KEY`
    - **Value**: Paste your Google Gemini API key here.
7.  Click the **"Deploy"** button.

That's it! Vercel will build and deploy your site. Once it's done, you'll get a public URL to your live application.

## Option 2: Netlify

Netlify is another excellent, user-friendly platform for deploying web apps.

**Step 1: Push Your Code to GitHub**
- Follow Step 1 from the Vercel instructions if you haven't already.

**Step 2: Deploy on Netlify**
1.  Go to [netlify.com](https://www.netlify.com/) and sign up with your GitHub account.
2.  On your dashboard, click **"Add new site" -> "Import an existing project"**.
3.  Connect to GitHub and authorize it.
4.  Choose your repository from the list.
5.  Netlify should auto-detect the settings. Ensure they are:
    - **Build command**: `npm run build`
    - **Publish directory**: `dist`
6.  Go to the **"Site configuration"** page for your new site, then navigate to **"Build & deploy" -> "Environment" -> "Environment variables"**.
7.  Click **"Add a variable"** and add your API key:
    - **Key**: `VITE_API_KEY`
    - **Value**: Paste your Google Gemini API key.
8.  Go back to the deploys list and trigger a new deploy to use the variable.

Netlify will now build and host your application, providing you with a live URL when it's finished.

## Option 3: Hugging Face Spaces

Hugging Face (HF) is a platform focused on the AI/ML community. Deploying here is great for visibility within that ecosystem. This method is a bit more advanced as it uses Docker.

**Step 1: Create a Hugging Face Space**
1.  Sign up for an account at [huggingface.co](https://huggingface.co/).
2.  Click your profile picture, then **"New Space"**.
3.  Give your Space a name (e.g., `pdf-orchestrator`).
4.  Select a license, like `Apache 2.0`.
5.  For the **"Space SDK"**, select **"Docker"** and then choose the **"Blank"** template.
6.  Click **"Create Space"**.

**Step 2: Add Your Code to the Space**
1.  On your new Space page, click the **"Files"** tab.
2.  Click **"Add file" -> "Upload files"**.
3.  Upload *all* the files from your project, including the new `Dockerfile`. *Note: This can be slow. Using Git to push to the space repository is a better long-term solution.*

**Step 3: Add Your API Key as a Secret**
1.  In your Space, go to the **"Settings"** tab.
2.  Scroll down to **"Repository secrets"**.
3.  Click **"New secret"**.
4.  Enter the following:
    - **Name**: `VITE_API_KEY`
    - **Value**: Paste your Google Gemini API key here.
5.  Click **"Save secret"**.

Hugging Face will now see your `Dockerfile` and the secret, and it will automatically start building your application. You can see the progress in the "Logs" tab. Once it's done, your application will be live at your Space URL.

*A note on your prompt: You mentioned Streamlit and `agents.yaml`, which are used for Python applications. The code provided is a modern React/TypeScript application. This guide is for deploying the provided React application.*

---

## 🤔 Follow-up Questions

**Q: My deployment failed! What do I do?**
A: Check the "Build Logs" or "Deployment Logs" on Vercel, Netlify, or Hugging Face. The logs will usually tell you the exact error, which is often a missing file, a typo in a command, or a misconfigured environment variable.

**Q: How do I update my live application?**
A: Simply push your new code changes to the `main` branch of your GitHub repository. Vercel and Netlify will automatically detect the changes and redeploy your app with the latest version. For Hugging Face, you'll need to upload the changed files again or push to its git repository.

**Q: Is it safe to put my API key in an environment variable for a front-end app?**
A: It's safer than putting it in the code, but it's not perfectly secure. The key will still be visible to anyone who inspects the network traffic of your web app. For a personal project or a demo, this is generally acceptable. For a real, production application with many users, the best practice is to create a backend (server-side) proxy that holds the key and makes the API calls on behalf of the user. This keeps the key completely secret.

**Q: Can I use a custom domain name (like `www.my-cool-app.com`)?**
A: Yes! All three platforms support custom domains. Check their official documentation for detailed instructions:
- [Vercel Custom Domains](https://vercel.com/docs/projects/domains/add-a-domain)
- [Netlify Custom Domains](https://docs.netlify.com/domains-https/custom-domains/)
- [Hugging Face Custom Domains](https://huggingface.co/docs/hub/spaces-custom-domains)