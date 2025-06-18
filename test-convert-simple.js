const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })

const testConvertSimple = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log('🔍 Testing basic database access...')
  console.log('URL:', supabaseUrl ? '✅ Found' : '❌ Missing')
  console.log('Key:', supabaseKey ? '✅ Found' : '❌ Missing')

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials!')
    return false
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Test 1: Check if leads table exists and is accessible
    console.log('\n📋 Test 1: Checking leads table...')
    const { data: leadsTest, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .limit(1)

    if (leadsError) {
      console.log('❌ Leads table error:', leadsError.message)
      console.log('Error details:', leadsError)
      return false
    } else {
      console.log('✅ Leads table accessible')
      console.log('Current leads count:', leadsTest.length)
    }

    // Test 2: Check if accounts table exists
    console.log('\n🏢 Test 2: Checking accounts table...')
    const { data: accountsTest, error: accountsError } = await supabase
      .from('accounts')
      .select('*')
      .limit(1)

    if (accountsError) {
      console.log('❌ Accounts table error:', accountsError.message)
      console.log('Error details:', accountsError)
      console.log('⚠️ You may need to create the accounts table')
    } else {
      console.log('✅ Accounts table accessible')
      console.log('Current accounts count:', accountsTest.length)
    }

    // Test 3: Try to get a specific lead by ID
    console.log('\n🔍 Test 3: Testing lead lookup by ID...')
    const testLeadId = 'lead_003' // The ID from your error
    const { data: specificLead, error: specificError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', testLeadId)
      .single()

    if (specificError) {
      if (specificError.code === 'PGRST116') {
        console.log('❌ Lead not found with ID:', testLeadId)
        console.log('This might be the issue - the lead ID format might be wrong')
      } else {
        console.log('❌ Error fetching specific lead:', specificError.message)
        console.log('Error details:', specificError)
      }
    } else {
      console.log('✅ Lead found:', specificLead)
    }

    console.log('\n🎉 Basic database tests completed!')
    return true

  } catch (error) {
    console.error('❌ Database test failed:', error)
    return false
  }
}

// Run the test
testConvertSimple()
  .then(success => {
    if (success) {
      console.log('\n✅ Database is accessible')
      process.exit(0)
    } else {
      console.log('\n❌ Database has issues')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('❌ Test error:', error)
    process.exit(1)
  }) 