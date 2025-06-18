const testStatusUpdate = async () => {
  console.log('🚀 Testing Lead Status Update API...\n')

  // First, create a test lead
  console.log('📝 Step 1: Creating a test lead...')
  const createResponse = await fetch('http://localhost:3000/api/leads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      company_name: 'Status Test Company',
      person_name: 'Test User',
      email: `status.test.${Date.now()}@example.com`,
      phone: '+1-555-999-8888',
      status: 'New'
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

  // Test 1: Update status from New to Qualified
  console.log('\n🧪 Test 1: Updating status from New to Qualified...')
  const statusUpdate1 = await fetch(`http://localhost:3000/api/leads/${leadId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'Qualified',
      notes: 'Lead has shown interest and meets our criteria',
      updated_by: 'test-user'
    })
  })

  if (statusUpdate1.ok) {
    const result1 = await statusUpdate1.json()
    console.log('✅ Status updated successfully')
    console.log('Response:', JSON.stringify(result1, null, 2))
  } else {
    const error1 = await statusUpdate1.text()
    console.log('❌ Status update failed:', error1)
  }

  // Test 2: Update status to Contacted
  console.log('\n🧪 Test 2: Updating status to Contacted...')
  const statusUpdate2 = await fetch(`http://localhost:3000/api/leads/${leadId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'Contacted',
      notes: 'Initial contact made via email'
    })
  })

  if (statusUpdate2.ok) {
    const result2 = await statusUpdate2.json()
    console.log('✅ Status updated successfully')
    console.log('Response:', JSON.stringify(result2, null, 2))
  } else {
    const error2 = await statusUpdate2.text()
    console.log('❌ Status update failed:', error2)
  }

  // Test 3: Invalid status transition (should fail)
  console.log('\n🧪 Test 3: Testing invalid status transition (Contacted → New)...')
  const statusUpdate3 = await fetch(`http://localhost:3000/api/leads/${leadId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'New'
    })
  })

  if (!statusUpdate3.ok) {
    const error3 = await statusUpdate3.json()
    console.log('✅ Invalid transition correctly rejected')
    console.log('Error:', JSON.stringify(error3, null, 2))
  } else {
    console.log('❌ Invalid transition should have been rejected')
  }

  // Test 4: Invalid status value
  console.log('\n🧪 Test 4: Testing invalid status value...')
  const statusUpdate4 = await fetch(`http://localhost:3000/api/leads/${leadId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'InvalidStatus'
    })
  })

  if (!statusUpdate4.ok) {
    const error4 = await statusUpdate4.json()
    console.log('✅ Invalid status correctly rejected')
    console.log('Error:', JSON.stringify(error4, null, 2))
  } else {
    console.log('❌ Invalid status should have been rejected')
  }

  // Test 5: Missing status field
  console.log('\n🧪 Test 5: Testing missing status field...')
  const statusUpdate5 = await fetch(`http://localhost:3000/api/leads/${leadId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      notes: 'This should fail'
    })
  })

  if (!statusUpdate5.ok) {
    const error5 = await statusUpdate5.json()
    console.log('✅ Missing status correctly rejected')
    console.log('Error:', JSON.stringify(error5, null, 2))
  } else {
    console.log('❌ Missing status should have been rejected')
  }

  // Clean up - delete the test lead
  console.log('\n🧹 Cleaning up test lead...')
  const deleteResponse = await fetch(`http://localhost:3000/api/leads/${leadId}`, {
    method: 'DELETE'
  })

  if (deleteResponse.ok) {
    console.log('✅ Test lead cleaned up')
  } else {
    console.log('⚠️ Could not clean up test lead')
  }

  console.log('\n🎉 Status update API testing completed!')
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
  await testStatusUpdate()
}

runTest().catch(console.error) 