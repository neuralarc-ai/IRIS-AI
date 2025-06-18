const testDateFormat = async () => {
  console.log('🚀 Testing Date Format and Data Transformation...\n')

  // Test 1: Create a lead and check the response format
  console.log('📝 Test 1: Creating a lead to check date format...')
  const createResponse = await fetch('http://localhost:3000/api/leads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      company_name: 'Date Test Company',
      person_name: 'Date Test User',
      email: `date.test.${Date.now()}@example.com`,
      phone: '+1-555-888-9999',
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
  console.log('✅ Lead created successfully')
  console.log('Raw API response:', JSON.stringify(createData.data, null, 2))

  // Test 2: Check the date fields specifically
  console.log('\n📅 Test 2: Checking date fields...')
  const lead = createData.data
  console.log('created_at:', lead.created_at)
  console.log('updated_at:', lead.updated_at)
  console.log('created_at type:', typeof lead.created_at)
  console.log('updated_at type:', typeof lead.updated_at)

  // Test 3: Test date parsing
  console.log('\n🔍 Test 3: Testing date parsing...')
  try {
    const { parseISO, formatDistanceToNow } = require('date-fns')
    
    const createdDate = parseISO(lead.created_at)
    const updatedDate = parseISO(lead.updated_at)
    
    console.log('Parsed created_at:', createdDate)
    console.log('Parsed updated_at:', updatedDate)
    console.log('Formatted created_at:', formatDistanceToNow(createdDate, { addSuffix: true }))
    console.log('Formatted updated_at:', formatDistanceToNow(updatedDate, { addSuffix: true }))
    
    console.log('✅ Date parsing successful')
  } catch (error) {
    console.log('❌ Date parsing failed:', error.message)
  }

  // Test 4: Test data transformation
  console.log('\n🔄 Test 4: Testing data transformation...')
  const transformedLead = {
    id: lead.id,
    companyName: lead.company_name,
    personName: lead.person_name,
    email: lead.email,
    phone: lead.phone,
    linkedinProfileUrl: lead.linkedin_profile_url,
    country: lead.country,
    status: lead.status,
    opportunityIds: [],
    updateIds: [],
    createdAt: lead.created_at,
    updatedAt: lead.updated_at,
  }
  
  console.log('Transformed lead:', JSON.stringify(transformedLead, null, 2))
  console.log('✅ Data transformation successful')

  console.log('\n🎉 Date format and transformation test completed!')
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
  await testDateFormat()
}

runTest().catch(console.error) 