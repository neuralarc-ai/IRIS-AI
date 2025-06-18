import { createClient } from '@supabase/supabase-js'
import type { Lead } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export class LeadsService {
  // Get all leads
  static async getLeads(status?: string, limit: number = 50, offset: number = 0) {
    try {
      let query = supabase
        .from('leads')
        .select('*')
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching leads:', error)
        throw new Error('Failed to fetch leads')
      }

      return {
        data: data || [],
        count: count || 0,
        pagination: {
          limit,
          offset,
          hasMore: (data?.length || 0) === limit
        }
      }
    } catch (error) {
      console.error('LeadsService.getLeads error:', error)
      throw error
    }
  }

  // Get lead by ID
  static async getLeadById(id: string) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Lead not found')
        }
        console.error('Error fetching lead:', error)
        throw new Error('Failed to fetch lead')
      }

      return data
    } catch (error) {
      console.error('LeadsService.getLeadById error:', error)
      throw error
    }
  }

  // Create new lead
  static async createLead(leadData: {
    company_name: string
    person_name: string
    email: string
    phone?: string
    linkedin_profile_url?: string
    country?: string
    status?: string
  }) {
    try {
      // Validate required fields
      if (!leadData.company_name?.trim() || !leadData.person_name?.trim() || !leadData.email?.trim()) {
        throw new Error('Company name, person name, and email are required')
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(leadData.email)) {
        throw new Error('Invalid email format')
      }

      // Check if lead with same email already exists
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('email', leadData.email)
        .single()

      if (existingLead) {
        throw new Error('Lead with this email already exists')
      }

      // Create new lead
      const { data, error } = await supabase
        .from('leads')
        .insert({
          company_name: leadData.company_name,
          person_name: leadData.person_name,
          email: leadData.email,
          phone: leadData.phone || null,
          linkedin_profile_url: leadData.linkedin_profile_url || null,
          country: leadData.country || null,
          status: leadData.status || 'New'
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating lead:', error)
        throw new Error('Failed to create lead')
      }

      return data
    } catch (error) {
      console.error('LeadsService.createLead error:', error)
      throw error
    }
  }

  // Update lead
  static async updateLead(id: string, updates: Partial<{
    company_name: string
    person_name: string
    email: string
    phone: string
    linkedin_profile_url: string
    country: string
    status: string
  }>) {
    try {
      // Validate email if provided
      if (updates.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(updates.email)) {
          throw new Error('Invalid email format')
        }

        // Check if email already exists for another lead
        const { data: existingLead } = await supabase
          .from('leads')
          .select('id')
          .eq('email', updates.email)
          .neq('id', id)
          .single()

        if (existingLead) {
          throw new Error('Email already exists for another lead')
        }
      }

      // Update lead
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Lead not found')
        }
        console.error('Error updating lead:', error)
        throw new Error('Failed to update lead')
      }

      return data
    } catch (error) {
      console.error('LeadsService.updateLead error:', error)
      throw error
    }
  }

  // Delete lead
  static async deleteLead(id: string) {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting lead:', error)
        throw new Error('Failed to delete lead')
      }

      return true
    } catch (error) {
      console.error('LeadsService.deleteLead error:', error)
      throw error
    }
  }

  // Convert lead to account
  static async convertLeadToAccount(leadId: string) {
    try {
      const { data, error } = await supabase
        .rpc('convert_lead_to_account', { lead_uuid: leadId })

      if (error) {
        console.error('Error converting lead:', error)
        throw new Error('Failed to convert lead to account')
      }

      return data
    } catch (error) {
      console.error('LeadsService.convertLeadToAccount error:', error)
      throw error
    }
  }

  // Get lead updates
  static async getLeadUpdates(leadId: string) {
    try {
      const { data, error } = await supabase
        .from('updates')
        .select(`
          *,
          users!updates_updated_by_user_id_fkey(name)
        `)
        .eq('lead_id', leadId)
        .order('date', { ascending: false })

      if (error) {
        console.error('Error fetching lead updates:', error)
        throw new Error('Failed to fetch lead updates')
      }

      return data || []
    } catch (error) {
      console.error('LeadsService.getLeadUpdates error:', error)
      throw error
    }
  }
} 