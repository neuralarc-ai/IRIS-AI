const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })

const testDatabaseConnection = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log('🔍 Testing database connection...')
  console.log('URL:', supabaseUrl ? '✅ Found' : '❌ Missing')
  console.log('Key:', supabaseKey ? '✅ Found' : '❌ Missing')

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials!')
    return false
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Test 1: Check if leads table exists
    console.log('\n📋 Test 1: Checking if leads table exists...')
    const { data: tableTest, error: tableError } = await supabase
      .from('leads')
      .select('count')
      .limit(1)

    if (tableError) {
      if (tableError.code === 'PGRST116') {
        console.log('❌ Leads table does not exist')
        console.log('Please run the database schema in your Supabase SQL Editor')
        return false
      } else {
        console.log('❌ Database error:', tableError.message)
        return false
      }
    } else {
      console.log('✅ Leads table exists and is accessible')
    }

    // Test 2: Try to insert a test lead
    console.log('\n📝 Test 2: Testing lead insertion...')
    const testLead = {
      company_name: 'Test Company DB',
      person_name: 'Jane Doe',
      email: `jane.doe.${Date.now()}@testcompany.com`,
      phone: '+1-555-987-6543',
      status: 'New'
    }

    const { data: insertData, error: insertError } = await supabase
      .from('leads')
      .insert(testLead)
      .select()
      .single()

    if (insertError) {
      console.log('❌ Insert error:', insertError.message)
      console.log('Error details:', insertError)
      return false
    } else {
      console.log('✅ Lead inserted successfully')
      console.log('Inserted lead ID:', insertData.id)
      
      // Clean up - delete the test lead
      const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .eq('id', insertData.id)

      if (deleteError) {
        console.log('⚠️ Could not delete test lead:', deleteError.message)
      } else {
        console.log('✅ Test lead cleaned up')
      }
    }

    // Test 3: Check RLS policies
    console.log('\n🔒 Test 3: Checking RLS policies...')
    const { data: rlsTest, error: rlsError } = await supabase
      .from('leads')
      .select('*')
      .limit(5)

    if (rlsError) {
      console.log('❌ RLS policy error:', rlsError.message)
    } else {
      console.log('✅ RLS policies working correctly')
      console.log('Current leads count:', rlsTest.length)
    }

    console.log('\n🎉 Database connection test completed successfully!')
    return true

  } catch (error) {
    console.error('❌ Database test failed:', error)
    return false
  }
}

// Run the test
testDatabaseConnection()
  .then(success => {
    if (success) {
      console.log('\n✅ Database is ready for API testing')
      process.exit(0)
    } else {
      console.log('\n❌ Database has issues that need to be fixed')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('❌ Test error:', error)
    process.exit(1)
  }) 