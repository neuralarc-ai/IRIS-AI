-- IRIS-AI Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    pin TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads table
CREATE TABLE public.leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_name TEXT NOT NULL,
    person_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    linkedin_profile_url TEXT,
    country TEXT,
    status TEXT DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Qualified', 'Proposal Sent', 'Converted to Account', 'Lost')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Accounts table
CREATE TABLE public.accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Client', 'Channel Partner')),
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    description TEXT,
    contact_email TEXT,
    industry TEXT,
    contact_person_name TEXT,
    contact_phone TEXT,
    converted_from_lead_id UUID REFERENCES public.leads(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Opportunities table
CREATE TABLE public.opportunities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'Need Analysis' CHECK (status IN ('Need Analysis', 'Negotiation', 'In Progress', 'On Hold', 'Completed', 'Cancelled')),
    value DECIMAL(15,2) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Updates table
CREATE TABLE public.updates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('General', 'Call', 'Meeting', 'Email')),
    updated_by_user_id UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Settings table
CREATE TABLE public.api_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    deep_seek_api_key TEXT,
    deep_seek_model TEXT,
    open_router_api_key TEXT,
    open_router_model TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_created_at ON public.leads(created_at);
CREATE INDEX idx_leads_updated_at ON public.leads(updated_at);
CREATE INDEX idx_leads_email ON public.leads(email);

CREATE INDEX idx_accounts_status ON public.accounts(status);
CREATE INDEX idx_accounts_type ON public.accounts(type);
CREATE INDEX idx_accounts_converted_from_lead ON public.accounts(converted_from_lead_id);
CREATE INDEX idx_accounts_updated_at ON public.accounts(updated_at);

CREATE INDEX idx_opportunities_account_id ON public.opportunities(account_id);
CREATE INDEX idx_opportunities_status ON public.opportunities(status);
CREATE INDEX idx_opportunities_value ON public.opportunities(value);
CREATE INDEX idx_opportunities_start_date ON public.opportunities(start_date);
CREATE INDEX idx_opportunities_end_date ON public.opportunities(end_date);

CREATE INDEX idx_updates_opportunity_id ON public.updates(opportunity_id);
CREATE INDEX idx_updates_lead_id ON public.updates(lead_id);
CREATE INDEX idx_updates_account_id ON public.updates(account_id);
CREATE INDEX idx_updates_date ON public.updates(date);
CREATE INDEX idx_updates_type ON public.updates(type);
CREATE INDEX idx_updates_updated_by_user ON public.updates(updated_by_user_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users policies (users can only see their own data)
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Leads policies (all authenticated users can access)
CREATE POLICY "Authenticated users can view leads" ON public.leads
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert leads" ON public.leads
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update leads" ON public.leads
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Accounts policies
CREATE POLICY "Authenticated users can view accounts" ON public.accounts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert accounts" ON public.accounts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update accounts" ON public.accounts
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Opportunities policies
CREATE POLICY "Authenticated users can view opportunities" ON public.opportunities
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert opportunities" ON public.opportunities
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update opportunities" ON public.opportunities
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Updates policies
CREATE POLICY "Authenticated users can view updates" ON public.updates
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert updates" ON public.updates
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update updates" ON public.updates
    FOR UPDATE USING (auth.role() = 'authenticated');

-- API Settings policies (users can only access their own settings)
CREATE POLICY "Users can view own API settings" ON public.api_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API settings" ON public.api_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API settings" ON public.api_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Database Functions

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON public.opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_updates_updated_at BEFORE UPDATE ON public.updates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to convert lead to account
CREATE OR REPLACE FUNCTION convert_lead_to_account(lead_uuid UUID)
RETURNS UUID AS $$
DECLARE
    new_account_id UUID;
    lead_record RECORD;
BEGIN
    -- Get lead information
    SELECT * INTO lead_record FROM public.leads WHERE id = lead_uuid;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lead not found';
    END IF;
    
    IF lead_record.status IN ('Converted to Account', 'Lost') THEN
        RAISE EXCEPTION 'Lead already converted or lost';
    END IF;
    
    -- Check if account already exists
    SELECT id INTO new_account_id FROM public.accounts 
    WHERE converted_from_lead_id = lead_uuid OR 
          (name = lead_record.company_name AND contact_person_name = lead_record.person_name);
    
    IF new_account_id IS NOT NULL THEN
        -- Update existing account
        UPDATE public.accounts 
        SET status = 'Active',
            contact_email = COALESCE(lead_record.email, contact_email),
            contact_phone = COALESCE(lead_record.phone, contact_phone),
            updated_at = NOW()
        WHERE id = new_account_id;
    ELSE
        -- Create new account
        INSERT INTO public.accounts (
            name, type, status, description, contact_person_name, 
            contact_email, contact_phone, converted_from_lead_id
        ) VALUES (
            lead_record.company_name, 'Client', 'Active',
            format('Account converted from lead: %s - %s. LinkedIn: %s. Country: %s.',
                   lead_record.person_name, lead_record.company_name,
                   COALESCE(lead_record.linkedin_profile_url, 'N/A'),
                   COALESCE(lead_record.country, 'N/A')),
            lead_record.person_name, lead_record.email, lead_record.phone, lead_uuid
        ) RETURNING id INTO new_account_id;
    END IF;
    
    -- Update lead status
    UPDATE public.leads 
    SET status = 'Converted to Account', updated_at = NOW()
    WHERE id = lead_uuid;
    
    RETURN new_account_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get dashboard summary
CREATE OR REPLACE FUNCTION get_dashboard_summary()
RETURNS TABLE (
    active_leads BIGINT,
    active_accounts BIGINT,
    active_opportunities BIGINT,
    total_pipeline_value DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM public.leads WHERE status NOT IN ('Converted to Account', 'Lost')),
        (SELECT COUNT(*) FROM public.accounts WHERE status = 'Active'),
        (SELECT COUNT(*) FROM public.opportunities WHERE status IN ('In Progress', 'Negotiation', 'Need Analysis')),
        (SELECT COALESCE(SUM(value), 0) FROM public.opportunities WHERE status IN ('In Progress', 'Negotiation'));
END;
$$ LANGUAGE plpgsql;

-- Function to get recent updates with context
CREATE OR REPLACE FUNCTION get_recent_updates(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    opportunity_name TEXT,
    account_name TEXT,
    lead_company TEXT,
    date TIMESTAMP WITH TIME ZONE,
    content TEXT,
    type TEXT,
    updated_by_user_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        o.name as opportunity_name,
        a.name as account_name,
        l.company_name as lead_company,
        u.date,
        u.content,
        u.type,
        usr.name as updated_by_user_name
    FROM public.updates u
    LEFT JOIN public.opportunities o ON u.opportunity_id = o.id
    LEFT JOIN public.accounts a ON u.account_id = a.id
    LEFT JOIN public.leads l ON u.lead_id = l.id
    LEFT JOIN public.users usr ON u.updated_by_user_id = usr.id
    ORDER BY u.date DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data (optional - for testing)
INSERT INTO public.users (id, name, email, pin) VALUES 
    (gen_random_uuid(), 'Admin User', 'admin@iris.ai', '123456'),
    (gen_random_uuid(), 'Jane Doe', 'jane.doe@example.com', '654321');

-- Success message
SELECT 'Database schema created successfully!' as message; 