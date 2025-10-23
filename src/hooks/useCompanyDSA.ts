import { useState, useCallback } from 'react';

interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  platform: string;
  likes: number;
  dislikes: number;
  acceptanceRate: string | null;
  url: string;
  topicTags: string[];
  companyTags: string[];
  isPremium: boolean;
  accepted: number;
  submissions: number;
  userProgress?: {
    id: string;
    status: string;
    code: string;
    language: string;
    solvedAt: Date | null;
  } | null;
}

interface CompanyDSAResponse {
  success: boolean;
  data: Problem[];
  count: number;
  total: number;
  company: string;
  difficultyBreakdown: {
    EASY: number;
    MEDIUM: number;
    HARD: number;
  };
  isAdmin: boolean;
  pagination: {
    limit: number;
    offset: number;
    totalPages: number;
    currentPage: number;
  };
  error?: string;
}

interface FetchOptions {
  company: string;
  difficulty?: 'all' | 'EASY' | 'MEDIUM' | 'HARD';
  platform?: 'all' | 'LEETCODE' | 'GEEKSFORGEEKS' | 'HACKERRANK' | 'CODEFORCES';
  sortBy?: 'likes' | 'acceptance' | 'title' | 'difficulty';
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Hook to fetch company-wise DSA questions
 * Handles all caching and optimization
 */
export const useCompanyDSA = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CompanyDSAResponse | null>(null);

  const fetchProblems = useCallback(async (options: FetchOptions) => {
    try {
      setLoading(true);
      setError(null);

      if (!options.company || options.company === 'all' || options.company === 'undefined') {
        throw new Error('Company parameter is required');
      }

      const queryParams = new URLSearchParams({
        company: options.company,
        limit: (options.limit || 20).toString(),
        offset: (options.offset || 0).toString(),
        sortBy: options.sortBy || 'likes',
      });

      if (options.difficulty && options.difficulty !== 'all') {
        queryParams.append('difficulty', options.difficulty);
      }

      if (options.platform && options.platform !== 'all') {
        queryParams.append('platform', options.platform);
      }

      if (options.search && options.search.trim()) {
        queryParams.append('search', options.search);
      }

      const response = await fetch(`/api/problems/by-company?${queryParams.toString()}`);
      const result: CompanyDSAResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch problems');
      }

      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    data,
    fetchProblems,
  };
};

/**
 * Hook to fetch all companies for filtering
 */
export const useCompanies = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Array<{ name: string; count: number }>>([]);

  const fetchCompanies = useCallback(async (search?: string) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: '1000',
        offset: '0',
      });

      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`/api/companies?${params.toString()}`);
      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        setCompanies(result.data);
        return result.data;
      } else {
        throw new Error('Failed to fetch companies');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    companies,
    fetchCompanies,
  };
};

/**
 * Hook for caching company DSA data
 * Caches data in memory and localStorage
 */
export const useCompanyDSACache = () => {
  const memoryCache = new Map<string, { data: CompanyDSAResponse; timestamp: number }>();
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  const getCacheKey = (options: FetchOptions) => {
    return `company_dsa_${options.company}_${options.difficulty || 'all'}_${options.platform || 'all'}_${options.offset || 0}`;
  };

  const getFromCache = (key: string) => {
    const cached = memoryCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    memoryCache.delete(key);
    return null;
  };

  const setCache = (key: string, data: CompanyDSAResponse) => {
    memoryCache.set(key, { data, timestamp: Date.now() });
  };

  const clearCache = () => {
    memoryCache.clear();
  };

  return {
    getCacheKey,
    getFromCache,
    setCache,
    clearCache,
  };
};
