const fs = require('fs');
const file = 'src/components/OpenTabsSection/OpenTabsSection.module.css';
let css = fs.readFileSync(file, 'utf8');

// Replace domainCard
css = css.replace(/\.domainCard \{[\s\S]*?\}/, `.domainCard {
  background: var(--color-surface-card);
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: none;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
  height: auto;
  break-inside: avoid;
  margin-bottom: 12px;
}`);
css = css.replace(/\.domainCard:hover \{[\s\S]*?\}/, `.domainCard:hover { box-shadow: 0 2px 8px var(--shadow); transform: translateY(-1px); border-color: rgba(14,14,16,0.3); }`);

// Replace tabRow
css = css.replace(/\.tabRow \{[\s\S]*?\}/, `.tabRow {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 4px;
  transition: background 0.1s;
  border-bottom: 1px solid var(--color-hairline-soft);
  width: 100%;
}`);
// Note: tabRow hover has no explicit hover rule? Ah wait:
css = css.replace(/\.tabRow\.isDupe \{ background: rgba\(224, 49, 49, 0\.04\); \}/, `.tabRow.isDupe { background: rgba(224, 49, 49, 0.04); }\n.tabRow:hover { background: var(--color-surface-soft); }`);

// domainHeader
css = css.replace(/--purple/g, '--color-primary');
css = css.replace(/--warm-gray/g, '--color-hairline');
css = css.replace(/--ink/g, '--color-ink');
css = css.replace(/--muted/g, '--color-muted');
css = css.replace(/--paper/g, '--color-canvas');
css = css.replace(/--accent-amber/g, '--color-primary');
css = css.replace(/--status-abandoned/g, '--color-error');
css = css.replace(/--status-cooling/g, '--color-primary-active');
css = css.replace(/--card-bg/g, '--color-surface-card');

// Buttons
css = css.replace(/border-radius: 0/g, 'border-radius: var(--radius-md)');
css = css.replace(/\.popover \{\s*background: var\(--color-surface-card\);\s*border-radius: var\(--radius-md\);/g, `.popover {\n  background: var(--color-surface-card);\n  border-radius: var(--radius-lg);`);
css = css.replace(/\.nameInput \{([\s\S]*?)border-radius: 6px;/g, `.nameInput {$1border-radius: var(--radius-sm);`);
css = css.replace(/border-radius: 6px;/g, 'border-radius: var(--radius-sm);'); // just in case
css = css.replace(/\.confirmBtn \{\s*flex: 1;\s*padding: 8px;\s*border: none;\s*border-radius: var\(--radius-md\);\s*background: var\(--color-primary\);\s*color: white;\s*font-size: 13px;\s*font-weight: 600;\s*cursor: pointer;\s*\}/g, `.confirmBtn {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: white;
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}`);

// Save All btn is sectionAction which we already updated. But wait, saveBtn is for individual tabs/cards.
css = css.replace(/\.saveBtn \{[\s\S]*?\}/, `.saveBtn {
  background: transparent;
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-md);
  padding: 5px 12px;
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-ink);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}`);
css = css.replace(/\.saveBtn:hover \{[\s\S]*?\}/, `.saveBtn:hover { background: var(--color-surface-soft); }`);

fs.writeFileSync(file, css);
console.log('done');
