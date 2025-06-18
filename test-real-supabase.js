const testRealSupabase = async () => {
  console.log('🚀 Testing Real Supabase Integration...\n')

  // Test 1: Create a lead via API
  console.log('📝 Test 1: Creating a lead via API...')
  const createResponse = await fetch('http://localhost:3000/api/leads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      company_name: 'Real Supabase Test Company',
      person_name: 'Real Test User',
      email: `real.test.${Date.now()}@example.com`,
      phone: '+1-555-999-7777',
      linkedin_profile_url: 'https://linkedin.com/in/realtest',
      country: 'United States',
      status: 'New'
    })
  })

  if (!createResponse.ok) {
    console.log('❌ Failed to create lead')
    const errorData = await createResponse.text()
    console.log('Error:', errorData)
    return
  }

  const createData = await createResponse.json()
  const leadId = createData.data.id
  console.log(`✅ Lead created with ID: ${leadId}`)
  console.log('Lead data:', JSON.stringify(createData.data, null, 2))

  // Test 2: Fetch all leads
  console.log('\n📋 Test 2: Fetching all leads...')
  const fetchResponse = await fetch('http://localhost:3000/api/leads')
  
  if (fetchResponse.ok) {
    const fetchData = await fetchResponse.json()
    console.log(`✅ Fetched ${fetchData.data.length} leads`)
    console.log('Sample lead:', JSON.stringify(fetchData.data[0], null, 2))
  } else {
    console.log('❌ Failed to fetch leads')
    const errorData = await fetchResponse.text()
    console.log('Error:', errorData)
  }

  // Test 3: Fetch specific lead
  console.log('\n🔍 Test 3: Fetching specific lead...')
  const specificResponse = await fetch(`http://localhost:3000/api/leads/${leadId}`)
  
  if (specificResponse.ok) {
    const specificData = await specificResponse.json()
    console.log('✅ Specific lead fetched successfully')
    console.log('Lead data:', JSON.stringify(specificData.data, null, 2))
  } else {
    console.log('❌ Failed to fetch specific lead')
    const errorData = await specificResponse.text()
    console.log('Error:', errorData)
  }

  // Test 4: Convert lead to account
  console.log('\n🔄 Test 4: Converting lead to account...')
  const convertResponse = await fetch(`http://localhost:3000/api/leads/${leadId}/convert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      notes: 'Test conversion from real Supabase'
    })
  })

  if (convertResponse.ok) {
    const convertData = await convertResponse.json()
    console.log('✅ Lead converted successfully!')
    console.log('Conversion result:', JSON.stringify(convertData, null, 2))
  } else {
    const errorData = await convertResponse.text()
    console.log('❌ Failed to convert lead:', errorData)
  }

  console.log('\n🎉 Real Supabase integration test completed!')
}

// Check if server is running
const checkServer = async () => {
  try {
    const response = await fetch('http://localhost:3000')
    return response.ok
  } catch (error) {
    return false
  }
}

// Run the test
const runTest = async () => {
  console.log('🔍 Checking if Next.js server is running...')
  const serverRunning = await checkServer()
  
  if (!serverRunning) {
    console.log('❌ Next.js server is not running. Please start it with: npm run dev')
    process.exit(1)
  }
  
  console.log('✅ Server is running, starting tests...\n')
  await testRealSupabase()
}

runTest().catch(console.error) 