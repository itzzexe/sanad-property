// Monkey-patch process.exit to capture the error before NestJS exits
const fs = require('fs');
const origExit = process.exit;
const origStderrWrite = process.stderr.write;
let captured = '';

process.stderr.write = function(chunk) {
  captured += chunk.toString();
  return origStderrWrite.apply(process.stderr, arguments);
};

process.exit = function(code) {
  if (code !== 0 && captured) {
    // Strip ANSI codes
    const clean = captured.replace(/\x1b\[[0-9;]*m/g, '');
    fs.writeFileSync('C:\\tmp\\nest-di-error.txt', clean, 'utf8');
  }
  origExit(code);
};

require('./dist/src/main.js');
