import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface RealtimeSyncProps {
  table: string;
  onInsert?: (record: any) => void;
  onUpdate?: (record: any) => void;
  onDelete?: (record: any) => void;
  filter?: string;
}

export function useRealtimeSync({ 
  table, 
  onInsert, 
  onUpdate, 
  onDelete, 
  filter 
}: RealtimeSyncProps) {
  
  useEffect(() => {
    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: filter
        },
        async (payload) => {
          try {
            // For UPDATE and INSERT, fetch the complete record with relationships
            if ((payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') && 
                (onUpdate || onInsert)) {
              
              let query = supabase
                .from(table)
                .select('*, order_items(*)')
                .eq('id', payload.new.id)
                .single();
                
              const { data, error } = await query;
              
              if (!error) {
                if (payload.eventType === 'INSERT' && onInsert) {
                  onInsert(data);
                } else if (payload.eventType === 'UPDATE' && onUpdate) {
                  onUpdate(data);
                }
              } else {
                console.error(`Error fetching ${table} data:`, error);
              }
            } 
            // For DELETE, just pass the payload data
            else if (payload.eventType === 'DELETE' && onDelete) {
              onDelete(payload.old);
            }
          } catch (error) {
            console.error(`Error in realtime sync for ${table}:`, error);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to ${table} changes`);
        }
        if (status === 'CHANNEL_ERROR') {
          toast.error(`Failed to subscribe to ${table} changes`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, onInsert, onUpdate, onDelete, filter]);
}