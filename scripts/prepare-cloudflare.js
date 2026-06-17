const fs = require('fs');
const path = require('path');

const files = [
  {
    path: 'src/app/api/auth/[...nextauth]/route.ts',
    inject: 'export const runtime = "edge";'
  },
  {
    path: 'src/app/p/[punguanId]/layout.tsx',
    inject: 'export const runtime = "edge";'
  },
  {
    path: 'src/app/p/page.tsx',
    inject: 'export const runtime = "edge";'
  }
];

files.forEach(file => {
  const filePath = path.resolve(__dirname, '..', file.path);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('export const runtime = "edge"')) {
      content = content + '\n' + file.inject + '\n';
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Injected edge runtime into ${file.path}`);
    } else {
      console.log(`${file.path} already configured for edge runtime.`);
    }
  } else {
    console.error(`File not found: ${filePath}`);
  }
});
