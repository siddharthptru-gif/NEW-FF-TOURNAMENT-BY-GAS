const fs = require('fs');
let html = fs.readFileSync('user.html', 'utf8');

// Dark mode backgrounds
html = html.replace(/bg-zinc-950/g, 'bg-white');
html = html.replace(/bg-zinc-900\/50/g, 'bg-slate-50');
html = html.replace(/bg-zinc-900\/30/g, 'bg-slate-50');
html = html.replace(/bg-zinc-900/g, 'bg-slate-50');
html = html.replace(/bg-zinc-800/g, 'bg-slate-100');
html = html.replace(/bg-zinc-700/g, 'bg-slate-200');

// Dark mode borders
html = html.replace(/border-zinc-800\/50/g, 'border-slate-200');
html = html.replace(/border-zinc-800/g, 'border-slate-200');
html = html.replace(/border-white\/10/g, 'border-slate-200');

// Dark mode text
html = html.replace(/text-zinc-400/g, 'text-slate-500');
html = html.replace(/text-zinc-500/g, 'text-slate-500');
html = html.replace(/text-zinc-600/g, 'text-slate-400');

// Gray to Slate for consistency
html = html.replace(/text-gray-500/g, 'text-slate-500');
html = html.replace(/text-gray-400/g, 'text-slate-400');
html = html.replace(/border-gray-200/g, 'border-slate-200');
html = html.replace(/bg-gray-50/g, 'bg-slate-50');
html = html.replace(/bg-gray-100/g, 'bg-slate-100');
html = html.replace(/bg-gray-200/g, 'bg-slate-200');
html = html.replace(/text-black/g, 'text-slate-900');

// Handle text-white -> text-slate-900
html = html.replace(/text-white/g, 'text-slate-900');

// Revert text-slate-900 to text-white in specific contexts:
html = html.replace(/custom-gradient text-slate-900/g, 'custom-gradient text-white');
html = html.replace(/bg-blue-600 text-slate-900/g, 'bg-blue-600 text-white');
html = html.replace(/bg-red-600 text-slate-900/g, 'bg-red-600 text-white');
html = html.replace(/bg-green-600 text-slate-900/g, 'bg-green-600 text-white');
html = html.replace(/bg-black text-slate-900/g, 'bg-slate-900 text-white');
html = html.replace(/bg-slate-800 text-slate-900/g, 'bg-slate-800 text-white');
html = html.replace(/bg-slate-900 text-slate-900/g, 'bg-slate-900 text-white');
html = html.replace(/text-slate-900 p-2 rounded-full/g, 'text-white p-2 rounded-full');
html = html.replace(/text-slate-900 text-4xl/g, 'text-white text-4xl');
html = html.replace(/text-slate-900 font-black rounded-2xl shadow-xl uppercase text-\[10px\]/g, 'text-white font-black rounded-2xl shadow-xl uppercase text-[10px]');

// Revert text-slate-900 to text-white in JS template literals for match cards (banner overlay text)
html = html.replace(/<h4 class="font-serif font-black text-slate-900 text-lg uppercase leading-tight tracking-tight">\$\{t\.title\}<\/h4>/g, '<h4 class="font-serif font-black text-white text-lg uppercase leading-tight tracking-tight">${t.title}</h4>');
html = html.replace(/<p class="text-\[10px\] font-bold text-slate-500 uppercase mt-1">Match ID: <span class="text-slate-900">#\$\{getOrGenerateMatchCode\(t\)\}<\/span><\/p>/g, '<p class="text-[10px] font-bold text-slate-300 uppercase mt-1">Match ID: <span class="text-white">#${getOrGenerateMatchCode(t)}</span></p>');
html = html.replace(/<p class="text-sm font-black text-slate-900">\$\{pCount\}\/\$\{maxP\}<\/p>/g, '<p class="text-sm font-black text-white">${pCount}/${maxP}</p>');
html = html.replace(/<h4 id="md-title" class="font-serif font-black text-slate-900 text-xl uppercase leading-tight tracking-tight">Match Details<\/h4>/g, '<h4 id="md-title" class="font-serif font-black text-white text-xl uppercase leading-tight tracking-tight">Match Details</h4>');
html = html.replace(/<p id="md-id-display" class="text-\[10px\] font-bold text-slate-500 uppercase mt-1">Match ID: <span class="text-slate-900">#000000<\/span><\/p>/g, '<p id="md-id-display" class="text-[10px] font-bold text-slate-300 uppercase mt-1">Match ID: <span class="text-white">#000000</span></p>');

// Revert text-slate-900 to text-white in badges
html = html.replace(/px-3 py-1 bg-black\/60 backdrop-blur-md border border-slate-200 rounded-full text-\[10px\] font-black text-slate-900/g, 'px-3 py-1 bg-white/90 backdrop-blur-md border border-slate-200 rounded-full text-[10px] font-black text-slate-900 shadow-sm');
html = html.replace(/px-3 py-1 \$\{statusColor\} rounded-full text-\[10px\] font-black text-slate-900/g, 'px-3 py-1 ${statusColor} rounded-full text-[10px] font-black text-white');

// Revert text-slate-900 to text-white in toast
html = html.replace(/toast\.className = `p-4 rounded-2xl shadow-xl text-slate-900/g, 'toast.className = `p-4 rounded-2xl shadow-xl text-white');

// Revert text-slate-900 to text-white in player stats section
html = html.replace(/bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl text-slate-900/g, 'bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl text-white');

// Shadows
html = html.replace(/shadow-lg/g, 'shadow-[0_8px_30px_rgb(0,0,0,0.06)]');
html = html.replace(/shadow-xl/g, 'shadow-[0_12px_40px_rgb(0,0,0,0.08)]');
html = html.replace(/shadow-2xl/g, 'shadow-[0_20px_50px_rgb(0,0,0,0.1)]');
html = html.replace(/shadow-sm/g, 'shadow-[0_2px_10px_rgb(0,0,0,0.02)]');

// Make cards pop more
html = html.replace(/glass-card/g, 'glass-card shadow-[0_4px_20px_rgb(0,0,0,0.03)]');

fs.writeFileSync('user.html', html);
