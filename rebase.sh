git checkout upstream
git branch --set-upstream-to=origin-svgo/master
git pull origin-svgo
git checkout master
git rebase upstream
git push origin master --force
