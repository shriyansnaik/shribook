Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm install

Write-Host "`nAdding shadcn/ui components..." -ForegroundColor Cyan
$components = @(
  "button", "card", "input", "label", "badge", "tabs",
  "separator", "dialog", "sheet", "skeleton", "toast",
  "dropdown-menu", "switch", "select", "textarea", "avatar"
)
foreach ($c in $components) {
  Write-Host "  Adding $c..." -ForegroundColor Gray
  npx shadcn@latest add $c --yes --overwrite
}

Write-Host "`nSetup complete! Run 'npm run dev' to start the dev server." -ForegroundColor Green
