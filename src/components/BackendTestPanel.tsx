import { useState } from 'react';
import { productsApi, categoriesApi, calculatorLeadsApi } from '../utils/api';
import { Button } from './ui/button';
import { Card } from './ui/card';

export function BackendTestPanel() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (title: string, success: boolean, data: any) => {
    setResults(prev => [{
      id: Date.now(),
      title,
      success,
      data,
      timestamp: new Date().toLocaleTimeString()
    }, ...prev]);
  };

  const testHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://kimgjhjeerslwmlcwydr.supabase.co/functions/v1/make-server-df4da301/health', {
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpbWdqaGplZXJzbHdtbGN3eWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MTE4OTcsImV4cCI6MjA4MDk4Nzg5N30.6dZHA42Yd0k8NZwmilith4SrFgHQvSAqRnwTBoqXtiw'
        }
      });
      const data = await response.json();
      addResult('Health Check', response.ok, data);
    } catch (error: any) {
      addResult('Health Check', false, { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testSeed = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://kimgjhjeerslwmlcwydr.supabase.co/functions/v1/make-server-df4da301/seed', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpbWdqaGplZXJzbHdtbGN3eWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MTE4OTcsImV4cCI6MjA4MDk4Nzg5N30.6dZHA42Yd0k8NZwmilith4SrFgHQvSAqRnwTBoqXtiw',
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      addResult('Seed Database', response.ok, data);
    } catch (error: any) {
      addResult('Seed Database', false, { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testGetProducts = async () => {
    setLoading(true);
    try {
      const response = await productsApi.getProducts();
      addResult('Get Products', true, response);
    } catch (error: any) {
      addResult('Get Products', false, { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testCreateProduct = async () => {
    setLoading(true);
    try {
      const response = await productsApi.create({
        name: `Test Product ${Date.now()}`,
        sku: `TEST-${Date.now()}`,
        category: 'Gorden Custom',
        price: 150000,
        stock: 10,
        description: 'This is a test product created from frontend',
      });
      addResult('Create Product', true, response);
    } catch (error: any) {
      addResult('Create Product', false, { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testGetCategories = async () => {
    setLoading(true);
    try {
      const response = await categoriesApi.getCategories();
      addResult('Get Categories', true, response);
    } catch (error: any) {
      addResult('Get Categories', false, { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testSubmitLead = async () => {
    setLoading(true);
    try {
      const response = await calculatorLeadsApi.submit({
        name: 'Test Customer',
        phone: '081234567890',
        email: 'test@email.com',
        calculatorType: 'Smokering',
        estimatedPrice: 2500000,
        calculation: {
          product: { name: 'Test Gorden', category: 'Blackout' },
          dimensions: { width: 3, height: 2.5 },
        }
      });
      addResult('Submit Calculator Lead', true, response);
    } catch (error: any) {
      addResult('Submit Calculator Lead', false, { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl mb-6">🔍 Backend Connection Test</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <Button onClick={testHealth} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          1. Health Check
        </Button>
        <Button onClick={testSeed} disabled={loading} className="bg-green-600 hover:bg-green-700">
          2. Seed Database
        </Button>
        <Button onClick={testGetProducts} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
          3. Get Products
        </Button>
        <Button onClick={testCreateProduct} disabled={loading} className="bg-orange-600 hover:bg-orange-700">
          4. Create Product
        </Button>
        <Button onClick={testGetCategories} disabled={loading} className="bg-pink-600 hover:bg-pink-700">
          5. Get Categories
        </Button>
        <Button onClick={testSubmitLead} disabled={loading} className="bg-red-600 hover:bg-red-700">
          6. Submit Lead
        </Button>
      </div>

      {loading && (
        <div className="text-center py-4">
          <p className="text-gray-600">Testing...</p>
        </div>
      )}

      <div className="space-y-4">
        {results.map(result => (
          <Card key={result.id} className={`p-4 ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold">
                {result.success ? '✅' : '❌'} {result.title}
              </h3>
              <span className="text-xs text-gray-500">{result.timestamp}</span>
            </div>
            <pre className="text-xs bg-white p-3 rounded overflow-x-auto">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </Card>
        ))}
      </div>
    </div>
  );
}
