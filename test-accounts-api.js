const testAccountsAPI = async () => {
  console.log('🚀 Testing Accounts API...\n')

  // Test 1: Create a new account
  console.log('📝 Test 1: Creating a new account...')
  const createResponse = await fetch('http://localhost:3000/api/accounts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Test Account Company',
      type: 'Client',
      status: 'Active',
      description: 'A test account for API testing',
      contact_person_name: 'John Doe',
      contact_email: 'john.doe@testaccount.com',
      contact_phone: '+1-555-123-4567',
      industry: 'Technology'
    })
  })

  if (!createResponse.ok) {
    console.log('❌ Failed to create account')
    const errorData = await createResponse.text()
    console.log('Error:', errorData)
    return
  }

  const createData = await createResponse.json()
  const accountId = createData.data.id
  console.log(`✅ Account created with ID: ${accountId}`)
  console.log('Account data:', JSON.stringify(createData.data, null, 2))

  // Test 2: Fetch all accounts
  console.log('\n📋 Test 2: Fetching all accounts...')
  const fetchResponse = await fetch('http://localhost:3000/api/accounts')
  
  if (fetchResponse.ok) {
    const fetchData = await fetchResponse.json()
    console.log(`✅ Fetched ${fetchData.data.length} accounts`)
    console.log('Sample account:', JSON.stringify(fetchData.data[0], null, 2))
  } else {
    console.log('❌ Failed to fetch accounts')
    const errorData = await fetchResponse.text()
    console.log('Error:', errorData)
  }

  // Test 3: Fetch specific account
  console.log('\n🔍 Test 3: Fetching specific account...')
  const specificResponse = await fetch(`http://localhost:3000/api/accounts/${accountId}`)
  
  if (specificResponse.ok) {
    const specificData = await specificResponse.json()
    console.log('✅ Specific account fetched successfully')
    console.log('Account data:', JSON.stringify(specificData.data, null, 2))
  } else {
    console.log('❌ Failed to fetch specific account')
    const errorData = await specificResponse.text()
    console.log('Error:', errorData)
  }

  // Test 4: Update account
  console.log('\n✏️ Test 4: Updating account...')
  const updateResponse = await fetch(`http://localhost:3000/api/accounts/${accountId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: 'Updated description for testing',
      contact_phone: '+1-555-987-6543'
    })
  })

  if (updateResponse.ok) {
    const updateData = await updateResponse.json()
    console.log('✅ Account updated successfully')
    console.log('Updated account:', JSON.stringify(updateData.data, null, 2))
  } else {
    const errorData = await updateResponse.text()
    console.log('❌ Failed to update account:', errorData)
  }

  // Test 5: Test filtering
  console.log('\n🔍 Test 5: Testing account filtering...')
  const filterResponse = await fetch('http://localhost:3000/api/accounts?type=Client&status=Active')
  
  if (filterResponse.ok) {
    const filterData = await filterResponse.json()
    console.log(`✅ Filtered accounts: ${filterData.data.length} Client accounts with Active status`)
  } else {
    console.log('❌ Failed to filter accounts')
    const errorData = await filterResponse.text()
    console.log('Error:', errorData)
  }

  // Test 6: Test validation errors
  console.log('\n⚠️ Test 6: Testing validation errors...')
  
  // Test invalid type
  const invalidTypeResponse = await fetch('http://localhost:3000/api/accounts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Invalid Type Account',
      type: 'InvalidType'
    })
  })

  if (!invalidTypeResponse.ok) {
    const errorData = await invalidTypeResponse.json()
    console.log('✅ Invalid type correctly rejected:', errorData.error)
  } else {
    console.log('❌ Invalid type should have been rejected')
  }

  // Test missing required fields
  const missingFieldsResponse = await fetch('http://localhost:3000/api/accounts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: 'Missing name and type'
    })
  })

  if (!missingFieldsResponse.ok) {
    const errorData = await missingFieldsResponse.json()
    console.log('✅ Missing fields correctly rejected:', errorData.error)
  } else {
    console.log('❌ Missing fields should have been rejected')
  }

  // Test 7: Delete account (cleanup)
  console.log('\n🗑️ Test 7: Deleting test account...')
  const deleteResponse = await fetch(`http://localhost:3000/api/accounts/${accountId}`, {
    method: 'DELETE'
  })

  if (deleteResponse.ok) {
    console.log('✅ Account deleted successfully')
  } else {
    const errorData = await deleteResponse.text()
    console.log('❌ Failed to delete account:', errorData)
  }

  console.log('\n🎉 Accounts API testing completed!')
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
  await testAccountsAPI()
}

runTest().catch(console.error) 