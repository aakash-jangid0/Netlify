import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.8';
import { SMTPClient } from 'npm:emailjs@4.0.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const invoice = formData.get('invoice');
    const email = formData.get('email');
    const invoiceNumber = formData.get('invoice_number');
    const invoiceId = formData.get('invoice_id'); // Added support for invoice ID

    if (!invoice && !invoiceId) {
      throw new Error('Missing invoice data or ID');
    }
    
    if (!email) {
      throw new Error('Missing email address');
    }
    
    if (!invoiceNumber) {
      throw new Error('Missing invoice number');
    }

    // If we received an invoice ID but not the PDF, fetch from database
    let pdfBlob = invoice as Blob;
    if (invoiceId && !invoice) {
      // Set up Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Fetch invoice data
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          items:invoice_items(*)
        `)
        .eq('id', invoiceId)
        .single();
        
      if (error || !data) {
        throw new Error('Failed to retrieve invoice from database');
      }
      
      // TODO: Generate PDF from invoice data
      // This would require implementing jsPDF in Deno
      // For now, we'll require the PDF to be provided
      throw new Error('Dynamic PDF generation not yet supported in edge function');
    }

    // Configure SMTP client
    const client = new SMTPClient({
      user: Deno.env.get('SMTP_USER'),
      password: Deno.env.get('SMTP_PASSWORD'),
      host: Deno.env.get('SMTP_HOST'),
      ssl: true,
    });

    // Send email
    await client.send({
      text: `Your invoice ${invoiceNumber} is attached.`,
      from: 'billing@tastybites.com',
      to: email.toString(),
      subject: `TastyBites Invoice #${invoiceNumber}`,
      attachment: [
        {
          data: pdfBlob,
          name: `invoice-${invoiceNumber}.pdf`,
        },
      ],
    });

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Error sending invoice:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});