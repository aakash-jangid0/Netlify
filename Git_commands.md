# First time to setup git and upload project

# Navigate to your project folder
cd "path/to/your/project"

git config --global user.name "Aakash Jangid"
git config --global user.email "aakashjangid0@gmail.com"

git remote set-url origin https://github.com/aakash-jangid0/Netlify.git

git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main



# To push updates from local to git

# Check status
git status

# Stage changed files
git add .

# Commit with message
git commit -m "Your update message"

# Push changes
git push origin main



# Clone repo

# Go to the parent directory where you want the project
cd "C:/path/to/your/desired/location"

# Clone from GitHub
git clone https://github.com/your-username/your-repo.git



# Update your local project with latest changes from GitHub
git pull origin main
