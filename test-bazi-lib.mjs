// 测试 bazi-calculator-by-alvamind 库
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

try {
  // 尝试使用 tsx 运行 TypeScript 文件
  const { execSync } = require('child_process');
  const result = execSync('npx tsx -e "import { BaziCalculator } from \'./node_modules/bazi-calculator-by-alvamind/src/bazi-calculator.ts\'; const calc = new BaziCalculator(1989, 3, 16, 7); console.log(JSON.stringify(calc.calculatePillars(), null, 2));"', { 
    encoding: 'utf8',
    cwd: process.cwd()
  });
  console.log('Success:', result);
} catch (e) {
  console.error('Error:', e.message);
}

