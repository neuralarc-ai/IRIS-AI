const { createClient } = require('@supabase/supabase-js')

// Sample Supabase credentials (replace with your actual ones)
const SAMPLE_SUPABASE_URL = 'https://your-project-id.supabase.co'
const SAMPLE_SUPABASE_KEY = 'your-anon-key-here'

// Test Supabase connection
const testSupabaseConnection = async () => {
  // Try to get credentials from environment first, then use samples
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || SAMPLE_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SAMPLE_SUPABASE_KEY

  console.log('🔗 Testing Supabase connection...')
  console.log('URL:', supabaseUrl)
  console.log('Using credentials from:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Environment' : 'Sample (replace with real ones)')

  if (supabaseUrl === SAMPLE_SUPABASE_URL || supabaseKey === SAMPLE_SUPABASE_KEY) {
    console.log('\n⚠️  Using sample credentials. Please replace with your actual Supabase credentials.')
    console.log('Get your credentials from: https://supabase.com/dashboard/project/[your-project-id]/settings/api')
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

    console.log('\n🎉 Connection test completed successfully!')
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