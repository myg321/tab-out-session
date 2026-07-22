const fs = require('fs');
let file, css;

// SaveForLaterSidebar.module.css
file = 'src/components/SaveForLaterSidebar/SaveForLaterSidebar.module.css';
css = fs.readFileSync(file, 'utf8');
css = css.replace(/background: var\(--paper-2\);/g, 'background: var(--color-surface-card);');
css = css.replace(/border-radius: 0;/g, 'border-radius: var(--radius-md);');
css = css.replace(/--warm-gray/g, '--color-hairline');
css = css.replace(/--ink/g, '--color-ink');
css = css.replace(/--muted/g, '--color-muted');
css = css.replace(/--purple/g, '--color-primary');
css = css.replace(/--status-abandoned/g, '--color-error');
css = css.replace(/width: 260px;/g, 'width: 270px;\n  border-left: 1px solid var(--color-hairline);');
css = css.replace(/\.tabRow \{[\s\S]*?\}/, `.tabRow {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid var(--color-hairline-soft);
}`);
fs.writeFileSync(file, css);

// RecycleBin.module.css
file = 'src/components/RecycleBin/RecycleBin.module.css';
css = fs.readFileSync(file, 'utf8');
css = css.replace(/--warm-gray/g, '--color-hairline');
css = css.replace(/--ink/g, '--color-ink');
css = css.replace(/--muted/g, '--color-muted');
css = css.replace(/--purple/g, '--color-primary');
css = css.replace(/#C92A2A/g, 'var(--color-error)');
css = css.replace(/rgba\(201,42,42,0\.3\)/g, 'var(--color-error)');
css = css.replace(/rgba\(201,42,42,0\.08\)/g, 'rgba(198, 69, 69, 0.08)'); // Error color is #c64545 -> rgb 198,69,69
css = css.replace(/border-radius: 5px/g, 'border-radius: var(--radius-md)');
css = css.replace(/border-radius: 8px/g, 'border-radius: var(--radius-lg)');
css = css.replace(/--card-bg/g, 'var(--color-surface-card)');
css = css.replace(/\.emptyBtn \{[\s\S]*?\}/, `.emptyBtn {
  margin-left: auto;
  background: transparent;
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-md);
  padding: 3px 10px;
  font-size: 11px;
  color: var(--color-muted);
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}`);
css = css.replace(/\.restoreBtn \{[\s\S]*?\}/, `.restoreBtn {
  padding: 4px 10px;
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-md);
  background: transparent;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-ink);
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}`);
css = css.replace(/\.deleteBtn \{[\s\S]*?\}/, `.deleteBtn {
  padding: 4px 10px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-error);
  cursor: pointer;
  transition: background 0.15s;
}`);
fs.writeFileSync(file, css);

// QuickSites.module.css
file = 'src/components/QuickSites/QuickSites.module.css';
if (fs.existsSync(file)) {
  css = fs.readFileSync(file, 'utf8');
  css = css.replace(/\.iconTile \{[\s\S]*?\}/, `.iconTile {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  background: var(--color-canvas);
  border: 1px solid var(--color-hairline);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  transition: background 0.15s;
}`);
  css = css.replace(/\.site:hover \.iconTile \{[\s\S]*?\}/, `.site:hover .iconTile { background: var(--color-surface-soft); }`);
  css = css.replace(/\.addIcon \{[\s\S]*?\}/, `.addIcon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  background: transparent;
  border: 1px dashed var(--color-hairline);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  transition: background 0.15s;
  color: var(--color-muted);
}`);
  css = css.replace(/\.label \{[\s\S]*?\}/, `.label {
  font-family: var(--font-sans);
  font-size: 11px;
  color: var(--color-muted);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}`);
  fs.writeFileSync(file, css);
}

console.log('done');
