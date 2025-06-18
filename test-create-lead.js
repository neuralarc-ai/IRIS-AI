// Simple test for create lead API
const testCreateLead = async () => {
  const testData = {
    company_name: 'Test Company API',
    person_name: 'John Doe',
    email: `john.doe.${Date.now()}@testcompany.com`, // Unique email
    phone: '+1-555-123-4567',
    linkedin_profile_url: 'https://linkedin.com/in/johndoe',
    country: 'United States',
    status: 'New'
  };

  console.log('🧪 Testing Create Lead API...');
  console.log('Test data:', testData);

  try {
    const response = await fetch('http://localhost:9002/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    console.log('Response status:', response.status);
    console.log('Response data:', result);

    if (response.ok) {
      console.log('✅ Lead created successfully!');
      console.log('Lead ID:', result.data.id);
      console.log('Company:', result.data.company_name);
      console.log('Email:', result.data.email);
      return result.data.id;
    } else {
      console.log('❌ Failed to create lead:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    return null;
  }
};

// Test error handling
const testErrorHandling = async () => {
  console.log('\n⚠️ Testing error handling...');

  // Test 1: Missing required fields
  console.log('\nTest 1: Missing required fields');
  try {
    const response = await fetch('http://localhost:9002/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company_name: 'Test Company',
        // Missing person_name and email
      })
    });

    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Error:', result.error);
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Test 2: Invalid email
  console.log('\nTest 2: Invalid email');
  try {
    const response = await fetch('http://localhost:9002/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company_name: 'Test Company',
        person_name: 'John Doe',
        email: 'invalid-email',
        status: 'New'
      })
    });

    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Error:', result.error);
  } catch (error) {
    console.error('Error:', error.message);
  }
};

// Run tests
const runTests = async () => {
  console.log('🚀 Starting Create Lead API Tests...\n');
  
  // Test successful creation
  const leadId = await testCreateLead();
  
  // Test error handling
  await testErrorHandling();
  
  console.log('\n🎉 API testing completed!');
  
  if (leadId) {
    console.log('✅ API is working correctly');
  } else {
    console.log('❌ API has issues');
  }
};

// Check if server is running
const checkServer = async () => {
  try {
    const response = await fetch('http://localhost:9002/api/leads');
    return response.status !== 404;
  } catch {
    return false;
  }
};

// Main execution
const main = async () => {
  console.log('🔍 Checking if Next.js server is running...');
  
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Next.js server is not running!');
    console.log('Please start your development server with: npm run dev');
    process.exit(1);
  }
  
  console.log('✅ Server is running, starting tests...\n');
  await runTests();
};

main().catch(console.error); 