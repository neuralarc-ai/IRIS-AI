-- Create accounts table
CREATE TABLE public.accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'Client' CHECK (type IN ('Client', 'Channel Partner')),
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    description TEXT,
    contact_person_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    industry TEXT,
    converted_from_lead_id UUID REFERENCES public.leads(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_accounts_name ON public.accounts(name);
CREATE INDEX idx_accounts_type ON public.accounts(type);
CREATE INDEX idx_accounts_status ON public.accounts(status);
CREATE INDEX idx_accounts_converted_from_lead_id ON public.accounts(converted_from_lead_id);
CREATE INDEX idx_accounts_created_at ON public.accounts(created_at);
CREATE INDEX idx_accounts_updated_at ON public.accounts(updated_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for accounts table
-- Allow all operations for now (you can restrict this later based on user roles)
CREATE POLICY "Allow all operations on accounts" ON public.accounts
    FOR ALL USING (true);

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get account statistics
CREATE OR REPLACE FUNCTION get_account_stats()
RETURNS TABLE (
    total_accounts BIGINT,
    active_accounts BIGINT,
    inactive_accounts BIGINT,
    client_accounts BIGINT,
    channel_partner_accounts BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_accounts,
        COUNT(*) FILTER (WHERE status = 'Active') as active_accounts,
        COUNT(*) FILTER (WHERE status = 'Inactive') as inactive_accounts,
        COUNT(*) FILTER (WHERE type = 'Client') as client_accounts,
        COUNT(*) FILTER (WHERE type = 'Channel Partner') as channel_partner_accounts
    FROM public.accounts;
END;
$$ LANGUAGE plpgsql; 