'use client';

import { useState, useEffect } from 'react';
import { PRAnalysis } from '@/lib/types/personalRecords';

interface UsePersonalRecordsOptions {
  autoFetch?: boolean;
  refreshInterval?: number;
}

export function usePersonalRecords(options: UsePersonalRecordsOptions = {}) {
  const { autoFetch = true, refreshInterval } = options;
  
  const [prAnalysis, setPRAnalysis] = useState<PRAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchPRData = async (refresh = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/strava/personal-records${refresh ? '?refresh=true' : ''}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch personal records`);
      }
      
      const data = await response.json();
      setPRAnalysis(data);
      setLastFetch(new Date());
      setError(null);
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching personal records';
      setError(errorMessage);
      console.error('Error fetching personal records:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const refreshPRData = () => fetchPRData(true);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchPRData();
    }
  }, [autoFetch]);

  // Set up refresh interval if provided
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(() => {
        fetchPRData();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  // Computed values
  const hasData = prAnalysis !== null;
  const hasPRs = hasData && prAnalysis.personalRecords.length > 0;
  const summary = prAnalysis?.summary || null;
  const recentImprovements = prAnalysis?.recentImprovements || [];
  const potentialPRs = prAnalysis?.potentialPRs || [];

  return {
    // Data
    prAnalysis,
    personalRecords: prAnalysis?.personalRecords || [],
    recentImprovements,
    potentialPRs,
    summary,
    
    // State
    loading,
    error,
    hasData,
    hasPRs,
    lastFetch,
    
    // Actions
    fetchPRData,
    refreshPRData,
    
    // Utils
    retry: () => fetchPRData(),
    isStale: lastFetch ? (Date.now() - lastFetch.getTime()) > (30 * 60 * 1000) : false, // 30 minutes
  };
}