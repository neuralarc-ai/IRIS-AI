const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })

const testLeadCreation = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials!')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Sample mock data for lead creation
  const sampleLeads = [
    {
      company_name: 'TechCorp Solutions',
      person_name: 'Sarah Johnson',
      email: 'sarah.johnson@techcorp.com',
      phone: '+1-555-123-4567',
      linkedin_profile_url: 'https://linkedin.com/in/sarahjohnson',
      country: 'United States',
      status: 'New',
      source: 'Website',
      industry: 'Technology',
      company_size: '50-200',
      budget_range: '$50K-$100K',
      notes: 'Interested in our CRM solution. Follow up scheduled for next week.'
    },
    {
      company_name: 'Global Manufacturing Inc',
      person_name: 'Michael Chen',
      email: 'mchen@globalmanufacturing.com',
      phone: '+1-555-987-6543',
      linkedin_profile_url: 'https://linkedin.com/in/michaelchen',
      country: 'Canada',
      status: 'Qualified',
      source: 'LinkedIn',
      industry: 'Manufacturing',
      company_size: '200-500',
      budget_range: '$100K-$250K',
      notes: 'Looking for enterprise solution. Decision maker identified.'
    },
    {
      company_name: 'StartupXYZ',
      person_name: 'Emily Rodriguez',
      email: 'emily@startupxyz.com',
      phone: '+1-555-456-7890',
      linkedin_profile_url: 'https://linkedin.com/in/emilyrodriguez',
      country: 'United States',
      status: 'New',
      source: 'Referral',
      industry: 'SaaS',
      company_size: '10-50',
      budget_range: '$25K-$50K',
      notes: 'Early stage startup. Need basic features to start.'
    }
  ]

  console.log('🚀 Testing Lead Creation with Sample Data...\n')

  for (let i = 0; i < sampleLeads.length; i++) {
    const lead = sampleLeads[i]
    console.log(`📝 Creating Lead ${i + 1}: ${lead.company_name}`)
    console.log('Data:', JSON.stringify(lead, null, 2))

    try {
      const { data, error } = await supabase
        .from('leads')
        .insert(lead)
        .select()
        .single()

      if (error) {
        console.log(`❌ Error creating lead: ${error.message}`)
        console.log('Error details:', error)
      } else {
        console.log(`✅ Lead created successfully!`)
        console.log(`   ID: ${data.id}`)
        console.log(`   Created at: ${data.created_at}`)
        console.log(`   Status: ${data.status}`)
      }
    } catch (err) {
      console.log(`❌ Exception: ${err.message}`)
    }

    console.log('---\n')
  }

  // Test retrieving all leads
  console.log('📋 Retrieving all leads from database...')
  try {
    const { data: allLeads, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.log(`❌ Error retrieving leads: ${error.message}`)
    } else {
      console.log(`✅ Retrieved ${allLeads.length} leads:`)
      allLeads.forEach((lead, index) => {
        console.log(`   ${index + 1}. ${lead.company_name} - ${lead.person_name} (${lead.status})`)
      })
    }
  } catch (err) {
    console.log(`❌ Exception retrieving leads: ${err.message}`)
  }
}

// Run the test
testLeadCreation()
  .then(() => {
    console.log('\n🎉 Lead creation test completed!')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Test error:', error)
    process.exit(1)
  }) 