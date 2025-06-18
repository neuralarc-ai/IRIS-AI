const testConvertFlow = async () => {
  console.log('🚀 Testing Complete Lead-to-Account Conversion Flow...\n')

  // Step 1: Create a test lead
  console.log('📝 Step 1: Creating a test lead...')
  const createResponse = await fetch('http://localhost:3000/api/leads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      company_name: 'Convert Test Company',
      person_name: 'Convert Test User',
      email: `convert.test.${Date.now()}@example.com`,
      phone: '+1-555-777-8888',
      linkedin_profile_url: 'https://linkedin.com/in/converttest',
      country: 'United States',
      status: 'Qualified'
    })
  })

  if (!createResponse.ok) {
    console.log('❌ Failed to create test lead')
    const errorData = await createResponse.text()
    console.log('Error:', errorData)
    return
  }

  const createData = await createResponse.json()
  const leadId = createData.data.id
  console.log(`✅ Test lead created with ID: ${leadId}`)
  console.log('Lead data:', JSON.stringify(createData.data, null, 2))

  // Step 2: Convert lead to account
  console.log('\n🔄 Step 2: Converting lead to account...')
  const convertResponse = await fetch(`http://localhost:3000/api/leads/${leadId}/convert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      notes: 'Test conversion from API'
    })
  })

  if (!convertResponse.ok) {
    console.log('❌ Failed to convert lead')
    const errorData = await convertResponse.text()
    console.log('Error:', errorData)
    return
  }

  const convertData = await convertResponse.json()
  const accountId = convertData.data.account.id
  console.log('✅ Lead converted successfully!')
  console.log('Conversion result:', JSON.stringify(convertData, null, 2))

  // Step 3: Verify lead status was updated
  console.log('\n📋 Step 3: Verifying lead status update...')
  const leadResponse = await fetch(`http://localhost:3000/api/leads/${leadId}`)
  
  if (leadResponse.ok) {
    const leadData = await leadResponse.json()
    console.log('✅ Lead status updated to:', leadData.data.status)
    console.log('Lead data:', JSON.stringify(leadData.data, null, 2))
  } else {
    console.log('❌ Failed to fetch updated lead')
  }

  // Step 4: Verify account was created
  console.log('\n🏢 Step 4: Verifying account creation...')
  const accountResponse = await fetch(`http://localhost:3000/api/accounts/${accountId}`)
  
  if (accountResponse.ok) {
    const accountData = await accountResponse.json()
    console.log('✅ Account created successfully!')
    console.log('Account data:', JSON.stringify(accountData.data, null, 2))
  } else {
    console.log('❌ Failed to fetch created account')
    console.log('Note: You may need to create the accounts API endpoint')
  }

  // Step 5: Test that lead cannot be converted again
  console.log('\n🔄 Step 5: Testing duplicate conversion (should fail)...')
  const duplicateConvertResponse = await fetch(`http://localhost:3000/api/leads/${leadId}/convert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      notes: 'This should fail'
    })
  })

  if (!duplicateConvertResponse.ok) {
    const errorData = await duplicateConvertResponse.json()
    console.log('✅ Duplicate conversion correctly rejected')
    console.log('Error:', JSON.stringify(errorData, null, 2))
  } else {
    console.log('❌ Duplicate conversion should have been rejected')
  }

  console.log('\n🎉 Complete conversion flow test completed!')
  console.log(`📊 Summary:`)
  console.log(`   - Lead ID: ${leadId}`)
  console.log(`   - Account ID: ${accountId}`)
  console.log(`   - Status: Converted`)
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
  await testConvertFlow()
}

runTest().catch(console.error) 