const fs = require('fs');
const path = require('path');
const walk = (dir) => {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.tsx')) {
      let c = fs.readFileSync(p, 'utf8');
      if (c.includes('<ScrollView') && !c.includes('keyboardShouldPersistTaps')) {
        c = c.replace(/<ScrollView/g, '<ScrollView keyboardShouldPersistTaps=\"handled\"');
        fs.writeFileSync(p, c);
      }
    }
  });
};
walk('C:\\Users\\salgo\\OneDrive\\Desktop\\WOW\\Frontend\\src\\screens');
console.log('Done');
