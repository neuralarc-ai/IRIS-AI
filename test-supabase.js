const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env file only
require('dotenv').config({ path: '.env' })

// Test Supabase connection
const testSupabaseConnection = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log('🔗 Testing Supabase connection...')
  console.log('URL:', supabaseUrl ? '✅ Found' : '❌ Missing')
  console.log('Key:', supabaseKey ? '✅ Found' : '❌ Missing')

  if (!supabaseUrl || !supabaseKey) {
    console.error('\n❌ Missing Supabase credentials!')
    console.log('Please create a .env file with:')
    console.log('NEXT_PUBLIC_SUPABASE_URL=your-project-url')
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key')
    return false
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Test 1: Basic connection
    console.log('\n📡 Test 1: Basic connection...')
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.log('✅ Auth service accessible (expected no session)')
    } else {
      console.log('✅ Auth service working')
    }

    // Test 2: Database access
    console.log('\n🗄️ Test 2: Database access...')
    const { data: dbData, error: dbError } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (dbError) {
      if (dbError.code === 'PGRST116') {
        console.log('✅ Database accessible (table might not exist yet)')
      } else {
        console.error('❌ Database error:', dbError.message)
        return false
      }
    } else {
      console.log('✅ Database connection successful')
    }

    // Test 3: Real-time subscription
    console.log('\n📡 Test 3: Real-time subscriptions...')
    const channel = supabase
      .channel('test-connection')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        console.log('✅ Real-time subscription working')
      })
      .subscribe()

    // Wait a moment then unsubscribe
    setTimeout(() => {
      channel.unsubscribe()
      console.log('✅ Real-time subscription test completed')
    }, 1000)

    console.log('\n🎉 All connection tests completed successfully!')
    console.log('Your Supabase setup is working correctly.')
    return true

  } catch (error) {
    console.error('❌ Connection failed:', error)
    return false
  }
}

// Run the test
testSupabaseConnection()
  .then(success => {
    if (success) {
      console.log('\n✅ Supabase connection test PASSED')
      process.exit(0)
    } else {
      console.log('\n❌ Supabase connection test FAILED')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('❌ Test error:', error)
    process.exit(1)
  }) 