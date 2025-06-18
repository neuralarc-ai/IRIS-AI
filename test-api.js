const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env' })

// Test API endpoints
const testLeadsAPI = async () => {
  const baseUrl = 'http://localhost:9002' // Your Next.js dev server port
  
  console.log('🧪 Testing Leads API endpoints...')
  console.log('Base URL:', baseUrl)

  // Test 1: Create a new lead
  console.log('\n📝 Test 1: Creating a new lead...')
  try {
    const createResponse = await fetch(`${baseUrl}/api/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company_name: 'Test Company API',
        person_name: 'John Doe',
        email: 'john.doe@testcompany.com',
        phone: '+1-555-123-4567',
        linkedin_profile_url: 'https://linkedin.com/in/johndoe',
        country: 'United States',
        status: 'New'
      })
    })

    const createData = await createResponse.json()
    
    if (createResponse.ok) {
      console.log('✅ Lead created successfully')
      console.log('   Lead ID:', createData.data.id)
      console.log('   Company:', createData.data.company_name)
      
      const leadId = createData.data.id

      // Test 2: Get the created lead
      console.log('\n📖 Test 2: Getting the created lead...')
      const getResponse = await fetch(`${baseUrl}/api/leads/${leadId}`)
      const getData = await getResponse.json()
      
      if (getResponse.ok) {
        console.log('✅ Lead retrieved successfully')
        console.log('   Email:', getData.data.email)
      } else {
        console.log('❌ Failed to get lead:', getData.error)
      }

      // Test 3: Update the lead
      console.log('\n✏️ Test 3: Updating the lead...')
      const updateResponse = await fetch(`${baseUrl}/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'Qualified',
          phone: '+1-555-987-6543'
        })
      })

      const updateData = await updateResponse.json()
      
      if (updateResponse.ok) {
        console.log('✅ Lead updated successfully')
        console.log('   New status:', updateData.data.status)
        console.log('   New phone:', updateData.data.phone)
      } else {
        console.log('❌ Failed to update lead:', updateData.error)
      }

      // Test 4: Get all leads
      console.log('\n📋 Test 4: Getting all leads...')
      const getAllResponse = await fetch(`${baseUrl}/api/leads`)
      const getAllData = await getAllResponse.json()
      
      if (getAllResponse.ok) {
        console.log('✅ All leads retrieved successfully')
        console.log('   Total leads:', getAllData.data.length)
        console.log('   Pagination:', getAllData.pagination)
      } else {
        console.log('❌ Failed to get all leads:', getAllData.error)
      }

      // Test 5: Get leads by status
      console.log('\n🔍 Test 5: Getting leads by status...')
      const getByStatusResponse = await fetch(`${baseUrl}/api/leads?status=Qualified`)
      const getByStatusData = await getByStatusResponse.json()
      
      if (getByStatusResponse.ok) {
        console.log('✅ Leads by status retrieved successfully')
        console.log('   Qualified leads:', getByStatusData.data.length)
      } else {
        console.log('❌ Failed to get leads by status:', getByStatusData.error)
      }

      // Test 6: Delete the lead
      console.log('\n🗑️ Test 6: Deleting the lead...')
      const deleteResponse = await fetch(`${baseUrl}/api/leads/${leadId}`, {
        method: 'DELETE'
      })

      const deleteData = await deleteResponse.json()
      
      if (deleteResponse.ok) {
        console.log('✅ Lead deleted successfully')
      } else {
        console.log('❌ Failed to delete lead:', deleteData.error)
      }

    } else {
      console.log('❌ Failed to create lead:', createData.error)
    }

  } catch (error) {
    console.error('❌ API test failed:', error.message)
  }

  // Test 7: Error handling - Invalid email
  console.log('\n⚠️ Test 7: Testing error handling (invalid email)...')
  try {
    const invalidResponse = await fetch(`${baseUrl}/api/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company_name: 'Invalid Company',
        person_name: 'Invalid Person',
        email: 'invalid-email',
        status: 'New'
      })
    })

    const invalidData = await invalidResponse.json()
    
    if (!invalidResponse.ok) {
      console.log('✅ Error handling working correctly')
      console.log('   Error:', invalidData.error)
    } else {
      console.log('❌ Should have rejected invalid email')
    }

  } catch (error) {
    console.error('❌ Error handling test failed:', error.message)
  }

  console.log('\n🎉 API testing completed!')
}

// Check if server is running
const checkServer = async () => {
  try {
    const response = await fetch('http://localhost:9002/api/leads')
    return response.status !== 404
  } catch {
    return false
  }
}

// Run tests
const runTests = async () => {
  console.log('🔍 Checking if Next.js server is running...')
  
  const serverRunning = await checkServer()
  
  if (!serverRunning) {
    console.log('❌ Next.js server is not running!')
    console.log('Please start your development server with: npm run dev')
    process.exit(1)
  }
  
  console.log('✅ Server is running, starting API tests...')
  await testLeadsAPI()
}

runTests().catch(console.error) 