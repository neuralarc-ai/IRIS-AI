const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env file
require('dotenv').config({ path: '.env' })

// Test database schema
const testDatabaseSchema = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials!')
    return false
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('🔍 Testing database schema...')

    // Test 1: Check if tables exist
    console.log('\n📋 Test 1: Checking tables...')
    
    const tables = ['users', 'leads', 'accounts', 'opportunities', 'updates', 'api_settings']
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1)

        if (error && error.code === 'PGRST116') {
          console.log(`❌ Table '${table}' not found`)
        } else if (error) {
          console.log(`⚠️  Table '${table}' error: ${error.message}`)
        } else {
          console.log(`✅ Table '${table}' exists and accessible`)
        }
      } catch (error) {
        console.log(`❌ Table '${table}' test failed: ${error.message}`)
      }
    }

    // Test 2: Check RPC functions
    console.log('\n⚙️ Test 2: Checking RPC functions...')
    
    try {
      const { data: summaryData, error: summaryError } = await supabase
        .rpc('get_dashboard_summary')

      if (summaryError) {
        console.log(`⚠️  get_dashboard_summary function: ${summaryError.message}`)
      } else {
        console.log('✅ get_dashboard_summary function working')
        console.log('   Summary data:', summaryData)
      }
    } catch (error) {
      console.log(`❌ RPC function test failed: ${error.message}`)
    }

    // Test 3: Test lead conversion function
    console.log('\n🔄 Test 3: Testing lead conversion function...')
    
    try {
      // First create a test lead
      const { data: newLead, error: leadError } = await supabase
        .from('leads')
        .insert({
          company_name: 'Test Company',
          person_name: 'Test Person',
          email: 'test@example.com',
          status: 'New'
        })
        .select()
        .single()

      if (leadError) {
        console.log(`⚠️  Could not create test lead: ${leadError.message}`)
      } else {
        console.log('✅ Test lead created successfully')
        
        // Test conversion function
        const { data: accountId, error: convertError } = await supabase
          .rpc('convert_lead_to_account', { lead_uuid: newLead.id })

        if (convertError) {
          console.log(`⚠️  Lead conversion function: ${convertError.message}`)
        } else {
          console.log('✅ Lead conversion function working')
          console.log('   Created account ID:', accountId)
        }
      }
    } catch (error) {
      console.log(`❌ Lead conversion test failed: ${error.message}`)
    }

    // Test 4: Check recent updates function
    console.log('\n📝 Test 4: Testing recent updates function...')
    
    try {
      const { data: updatesData, error: updatesError } = await supabase
        .rpc('get_recent_updates', { limit_count: 5 })

      if (updatesError) {
        console.log(`⚠️  get_recent_updates function: ${updatesError.message}`)
      } else {
        console.log('✅ get_recent_updates function working')
        console.log('   Updates count:', updatesData.length)
      }
    } catch (error) {
      console.log(`❌ Recent updates test failed: ${error.message}`)
    }

    console.log('\n🎉 Database schema test completed!')
    console.log('\n📋 Next steps:')
    console.log('1. Update your frontend code to use Supabase instead of mock data')
    console.log('2. Test all CRUD operations with real data')
    console.log('3. Set up real-time subscriptions for live updates')
    
    return true

  } catch (error) {
    console.error('❌ Schema test failed:', error)
    return false
  }
}

// Run the test
testDatabaseSchema()
  .then(success => {
    if (success) {
      console.log('\n✅ Database schema test completed')
      process.exit(0)
    } else {
      console.log('\n❌ Database schema test failed')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('❌ Test error:', error)
    process.exit(1)
  }) 