const fs = require('fs');

let html = fs.readFileSync('admin.html', 'utf8');

// 1. MAIN BACKGROUND: #0D1117
// 2. SIDEBAR: #11161F
// 3. CARD / PANEL BACKGROUND: #161D29
// 4. BORDER SYSTEM: rgba(255,255,255,0.06)
// 5. PRIMARY TEXT: #F8FAFC
// 6. SECONDARY TEXT: #94A3B8
// 7. PRIMARY ACCENT: #2563EB

// Replace background colors
html = html.replace(/bg-\[#0a0a0c\]/g, 'bg-[#0D1117]');
html = html.replace(/bg-gray-900/g, 'bg-[#0D1117]');
html = html.replace(/bg-gray-800/g, 'bg-[#161D29]');
html = html.replace(/bg-gray-700/g, 'bg-[#1E293B]');
html = html.replace(/bg-white\/5/g, 'bg-[#161D29]');
html = html.replace(/bg-white\/10/g, 'bg-[#1E293B]');

// Replace border colors
html = html.replace(/border-white\/10/g, 'border-[#2A3441]');
html = html.replace(/border-white\/5/g, 'border-[#2A3441]');
html = html.replace(/border-gray-700/g, 'border-[#2A3441]');
html = html.replace(/border-gray-600/g, 'border-[#334155]');

// Replace text colors
html = html.replace(/text-white/g, 'text-[#F8FAFC]');
html = html.replace(/text-gray-400/g, 'text-[#94A3B8]');
html = html.replace(/text-gray-300/g, 'text-[#CBD5E1]');
html = html.replace(/text-slate-500/g, 'text-[#94A3B8]');
html = html.replace(/text-slate-400/g, 'text-[#94A3B8]');

// Replace accent colors
html = html.replace(/bg-blue-600/g, 'bg-[#2563EB]');
html = html.replace(/hover:bg-blue-700/g, 'hover:bg-[#1D4ED8]');
html = html.replace(/text-blue-400/g, 'text-[#60A5FA]');
html = html.replace(/text-blue-500/g, 'text-[#3B82F6]');
html = html.replace(/border-blue-500/g, 'border-[#3B82F6]');
html = html.replace(/focus:border-blue-500/g, 'focus:border-[#3B82F6]');
html = html.replace(/shadow-blue-600\/20/g, 'shadow-[#2563EB]/20');

// Replace success/warning/danger
html = html.replace(/bg-green-600/g, 'bg-[#22C55E]');
html = html.replace(/hover:bg-green-700/g, 'hover:bg-[#16A34A]');
html = html.replace(/text-green-400/g, 'text-[#4ADE80]');

html = html.replace(/bg-yellow-600/g, 'bg-[#F59E0B]');
html = html.replace(/hover:bg-yellow-700/g, 'hover:bg-[#D97706]');

html = html.replace(/bg-red-600/g, 'bg-[#EF4444]');
html = html.replace(/hover:bg-red-700/g, 'hover:bg-[#DC2626]');
html = html.replace(/text-red-400/g, 'text-[#F87171]');
html = html.replace(/text-red-500/g, 'text-[#EF4444]');

// Fix specific elements
// Sidebar background
html = html.replace(/<aside class="w-64 glass/g, '<aside class="w-64 bg-[#11161F]');
// Remove glass class where it conflicts
html = html.replace(/class="([^"]*)glass([^"]*)"/g, function(match, p1, p2) {
    // If it already has a background color, just remove glass
    if (p1.includes('bg-[') || p2.includes('bg-[')) {
        return `class="${p1}${p2}"`.replace(/\s+/g, ' ');
    }
    return `class="${p1}bg-[#161D29]${p2}"`.replace(/\s+/g, ' ');
});

// Fix hover states for sidebar items
html = html.replace(/\.sidebar-item:hover \{[\s\S]*?\}/g, `.sidebar-item:hover {\n        background: #1E293B !important;\n        border-color: rgba(255, 255, 255, 0.06);\n        color: #F8FAFC;\n      }`);
html = html.replace(/\.sidebar-item\.active \{[\s\S]*?\}/g, `.sidebar-item.active {\n        background: #2563EB !important;\n        color: #ffffff !important;\n        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);\n        border-color: transparent;\n      }`);

// Fix glass-card
html = html.replace(/\.glass-card \{[\s\S]*?\}/g, `.glass-card {\n        background: #161D29;\n        border: 1px solid rgba(255, 255, 255, 0.06);\n        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n      }`);
html = html.replace(/\.glass-card:hover \{[\s\S]*?\}/g, `.glass-card:hover {\n        border-color: rgba(59, 130, 246, 0.3);\n        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(59, 130, 246, 0.3);\n      }`);

// Fix CSS variables
html = html.replace(/--premium-bg: #0a0a0c;/g, '--premium-bg: #0D1117;');
html = html.replace(/--premium-surface: rgba\(255, 255, 255, 0.03\);/g, '--premium-surface: #161D29;');
html = html.replace(/--premium-border: rgba\(255, 255, 255, 0.08\);/g, '--premium-border: rgba(255, 255, 255, 0.06);');
html = html.replace(/--premium-accent: #3b82f6;/g, '--premium-accent: #2563EB;');
html = html.replace(/--premium-text: #ffffff;/g, '--premium-text: #F8FAFC;');
html = html.replace(/--premium-text-muted: #94a3b8;/g, '--premium-text-muted: #94A3B8;');

fs.writeFileSync('admin.html', html);
console.log('Colors replaced successfully.');
