// 簡單測試腳本來查看 API 端點規格
import fs from 'fs';
const openapi = JSON.parse(fs.readFileSync('openapi.json', 'utf8'));

// 查找 images 端點
const imagesPath = "/api/v1/workspaces/{workspace_id}/datasets/{dataset_id}/images";
const endpoint = openapi.paths[imagesPath];

console.log('=== Images Endpoint ===');
console.log('Path:', imagesPath);
console.log('Methods:', Object.keys(endpoint));

if (endpoint.get) {
  console.log('\n=== GET Method ===');
  console.log('Summary:', endpoint.get.summary);
  console.log('Parameters:');
  if (endpoint.get.parameters) {
    endpoint.get.parameters.forEach(param => {
      console.log(`  - ${param.name} (${param.in}): ${param.description || ''}`);
      if (param.schema) {
        console.log(`    Type: ${param.schema.type}`);
        if (param.schema.default !== undefined) {
          console.log(`    Default: ${param.schema.default}`);
        }
        if (param.schema.minimum !== undefined) {
          console.log(`    Min: ${param.schema.minimum}`);
        }
        if (param.schema.maximum !== undefined) {
          console.log(`    Max: ${param.schema.maximum}`);
        }
      }
    });
  }
}
