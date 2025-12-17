import { useEffect, useState } from 'react';
import { productsApi, categoriesApi } from '../utils/api';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function AutoBackendTest() {
  const [results, setResults] = useState<any>({
    config: { projectId, apiKey: publicAnonKey.substring(0, 20) + '...' },
    tests: []
  });
  const [testing, setTesting] = useState(false);

  const addResult = (test: string, status: 'success' | 'error', data: any) => {
    setResults((prev: any) => ({
      ...prev,
      tests: [...prev.tests, { test, status, data, timestamp: new Date().toISOString() }]
    }));
  };

  const runTests = async () => {
    setTesting(true);
    setResults({ config: results.config, tests: [] });

    // Test 1: Health Check
    try {
      console.log('🔍 Test 1: Health Check');
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-df4da301/health`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();
      addResult('Health Check', response.ok ? 'success' : 'error', data);
      console.log('✅ Health Check:', data);
    } catch (error: any) {
      addResult('Health Check', 'error', { error: error.message });
      console.error('❌ Health Check failed:', error);
    }

    // Wait a bit
    await new Promise(r => setTimeout(r, 500));

    // Test 2: Seed Database
    try {
      console.log('🔍 Test 2: Seed Database');
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-df4da301/seed`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      addResult('Seed Database', response.ok ? 'success' : 'error', data);
      console.log('✅ Seed Database:', data);
    } catch (error: any) {
      addResult('Seed Database', 'error', { error: error.message });
      console.error('❌ Seed Database failed:', error);
    }

    // Wait a bit
    await new Promise(r => setTimeout(r, 500));

    // Test 3: Get Products via API utility
    try {
      console.log('🔍 Test 3: Get Products (via productsApi)');
      const response = await productsApi.getProducts();
      addResult('Get Products', 'success', response);
      console.log('✅ Get Products:', response);
    } catch (error: any) {
      addResult('Get Products', 'error', { error: error.message });
      console.error('❌ Get Products failed:', error);
    }

    // Wait a bit
    await new Promise(r => setTimeout(r, 500));

    // Test 4: Get Categories
    try {
      console.log('🔍 Test 4: Get Categories');
      const response = await categoriesApi.getCategories();
      addResult('Get Categories', 'success', response);
      console.log('✅ Get Categories:', response);
    } catch (error: any) {
      addResult('Get Categories', 'error', { error: error.message });
      console.error('❌ Get Categories failed:', error);
    }

    // Wait a bit
    await new Promise(r => setTimeout(r, 500));

    // Test 5: Create Product
    try {
      console.log('🔍 Test 5: Create Product');
      const testProduct = {
        name: `Auto Test Product ${Date.now()}`,
        sku: `AUTO-TEST-${Date.now()}`,
        category: 'Gorden Custom',
        price: 199000,
        stock: 15,
        description: 'This is an automatically created test product',
        images: ['https://images.unsplash.com/photo-1684261556324-a09b2cdf68b1?w=800'],
      };
      const response = await productsApi.create(testProduct);
      addResult('Create Product', 'success', response);
      console.log('✅ Create Product:', response);
    } catch (error: any) {
      addResult('Create Product', 'error', { error: error.message });
      console.error('❌ Create Product failed:', error);
    }

    setTesting(false);
  };

  useEffect(() => {
    // Auto-run tests on mount
    runTests();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h1 className="text-3xl mb-2">🔬 Automated Backend Test</h1>
          <p className="text-gray-600 mb-6">Testing Amagriya Gorden Backend Connection</p>

          {/* Configuration */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h3 className="text-sm mb-2">Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <span className="text-gray-600">Project ID:</span>{' '}
                <span className="text-gray-900">{results.config.projectId}</span>
              </div>
              <div>
                <span className="text-gray-600">API Key:</span>{' '}
                <span className="text-gray-900">{results.config.apiKey}</span>
              </div>
              <div>
                <span className="text-gray-600">Base URL:</span>{' '}
                <span className="text-gray-900">
                  https://{results.config.projectId}.supabase.co/functions/v1/make-server-df4da301
                </span>
              </div>
            </div>
          </div>

          {/* Run Tests Button */}
          <button
            onClick={runTests}
            disabled={testing}
            className="bg-[#EB216A] hover:bg-[#d11d5e] text-white px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            {testing ? '⏳ Running Tests...' : '🔄 Re-run All Tests'}
          </button>

          {/* Test Results */}
          <div className="space-y-4">
            <h3 className="text-lg">Test Results ({results.tests.length})</h3>
            
            {results.tests.length === 0 && !testing && (
              <div className="text-center py-12 text-gray-400">
                No tests run yet. Click the button above.
              </div>
            )}

            {results.tests.map((result: any, idx: number) => (
              <div
                key={idx}
                className={`border-2 rounded-xl p-4 ${
                  result.status === 'success'
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {result.status === 'success' ? '✅' : '❌'}
                    </span>
                    <div>
                      <h4 className="font-semibold">
                        {result.test}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${
                      result.status === 'success'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {result.status}
                  </span>
                </div>

                {/* Response Data */}
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm text-gray-700 hover:text-gray-900">
                    📋 View Response Data
                  </summary>
                  <pre className="mt-2 bg-white p-3 rounded-lg text-xs overflow-x-auto border border-gray-200">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              </div>
            ))}

            {testing && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#EB216A]"></div>
                <p className="mt-4 text-gray-600">Running tests...</p>
              </div>
            )}
          </div>

          {/* Summary */}
          {results.tests.length > 0 && !testing && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg mb-4">📊 Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-1">{results.tests.length}</div>
                  <div className="text-xs text-gray-600">Total Tests</div>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-1">
                    {results.tests.filter((t: any) => t.status === 'success').length}
                  </div>
                  <div className="text-xs text-gray-600">Passed</div>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-1">
                    {results.tests.filter((t: any) => t.status === 'error').length}
                  </div>
                  <div className="text-xs text-gray-600">Failed</div>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-1">
                    {results.tests.filter((t: any) => t.status === 'success').length === results.tests.length
                      ? '100%'
                      : Math.round((results.tests.filter((t: any) => t.status === 'success').length / results.tests.length) * 100) + '%'}
                  </div>
                  <div className="text-xs text-gray-600">Success Rate</div>
                </div>
              </div>

              {/* Diagnosis */}
              {results.tests.filter((t: any) => t.status === 'success').length === results.tests.length ? (
                <div className="mt-6 bg-green-100 border-2 border-green-300 rounded-xl p-4">
                  <h4 className="text-green-900 mb-2">🎉 All Tests Passed!</h4>
                  <p className="text-green-800 text-sm">
                    Backend is working perfectly. You can now use the Admin Products page to add/edit products,
                    and they will be saved to the database.
                  </p>
                  <div className="mt-4 flex gap-3">
                    <a
                      href="/admin/products"
                      className="inline-block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Go to Admin Products →
                    </a>
                    <a
                      href="/admin/calculator-leads"
                      className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Go to Calculator Leads →
                    </a>
                  </div>
                </div>
              ) : (
                <div className="mt-6 bg-yellow-100 border-2 border-yellow-300 rounded-xl p-4">
                  <h4 className="text-yellow-900 mb-2">⚠️ Some Tests Failed</h4>
                  <p className="text-yellow-800 text-sm mb-3">
                    Backend connection has issues. Check the error messages above.
                  </p>
                  <details className="text-sm">
                    <summary className="cursor-pointer text-yellow-900 hover:text-yellow-950">
                      🔧 Common Solutions
                    </summary>
                    <ul className="mt-2 space-y-2 text-yellow-800 list-disc list-inside">
                      <li>Check if Supabase project is running</li>
                      <li>Verify API keys in /utils/supabase/info.tsx</li>
                      <li>Check browser console for CORS errors</li>
                      <li>Ensure Edge Function is deployed</li>
                      <li>Try refreshing the page</li>
                    </ul>
                  </details>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/products"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <h3 className="text-lg mb-2">📦 Admin Products</h3>
            <p className="text-sm text-gray-600">Manage products, add new items</p>
          </a>
          <a
            href="/admin/calculator-leads"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <h3 className="text-lg mb-2">📊 Calculator Leads</h3>
            <p className="text-sm text-gray-600">View customer calculations</p>
          </a>
          <a
            href="/calculator"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <h3 className="text-lg mb-2">🧮 Calculator</h3>
            <p className="text-sm text-gray-600">Try the calculator yourself</p>
          </a>
        </div>
      </div>
    </div>
  );
}
