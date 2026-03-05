/* global console, process */
// Test to check what endpoints are in APIManager
import('./services/api-gateway/dist/config/api-manager.config.js').then(module => {
  const apiManager = module.default;
  
  console.log('\\n=== APIManager Status ===');
  console.log('Statistics:', apiManager.getStatistics());
  
  // Try to get the supplier endpoints
  const supplierListEndpoint = apiManager.getEndpoint('GET', '/api/suppliers');
  console.log('\\nGET /api/suppliers:', supplierListEndpoint);
  
  const supplierCreateEndpoint = apiManager.getEndpoint('POST', '/api/suppliers');
  console.log('POST /api/suppliers:', supplierCreateEndpoint);
  
  // Check what's in the route map for supplier routes
  console.log('\\nSupplier endpoints registered:');
  const stats = apiManager.getStatistics();
  console.log(`Total endpoints: ${stats.totalEndpoints}`);
  console.log(`B2B Admin Supplier endpoints: ${stats.b2bAdminSupplier || 0}`);
  
  // Try getting by other methods
  console.log('\\nTesting other paths:');
  console.log('GET /api/b2b/markup-rules:', apiManager.getEndpoint('GET', '/api/b2b/markup-rules'));
  
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
