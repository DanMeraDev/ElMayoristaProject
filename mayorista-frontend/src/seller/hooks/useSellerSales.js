import { useState, useEffect, useCallback, useMemo } from 'react';
import { getMySales, getMyCommission, getCommissionStats, getMyProfile } from '../../api/reports.api';

export default function useSellerSales(userId) {
  // Sales history state
  const [mySales, setMySales] = useState([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [salesPage, setSalesPage] = useState(0);
  const [salesTotalPages, setSalesTotalPages] = useState(0);
  const [selectedSale, setSelectedSale] = useState(null);

  // Sales filter state
  const [salesStatusFilter, setSalesStatusFilter] = useState('ALL');
  const [salesSortBy, setSalesSortBy] = useState('date_newest');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Commission state
  const [monthlyCommission, setMonthlyCommission] = useState(0);
  const [commissionStats, setCommissionStats] = useState({
    earnedCommission: 0,
    pendingReviewCommission: 0,
    pendingPaymentCommission: 0
  });
  const [commissionPercentage, setCommissionPercentage] = useState(5);

  const loadUserProfile = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await getMyProfile(userId);
      const profile = response.data;
      const percentage = profile?.commissionPercentage ?? profile?.commission ?? profile?.commissionRate ?? 5;
      setCommissionPercentage(percentage);
    } catch {
      // Keep default 5% on error
    }
  }, [userId]);

  const loadMySales = useCallback(async () => {
    if (!userId) return;
    setSalesLoading(true);
    try {
      const response = await getMySales(userId, salesPage, 5);
      const data = response.data;
      if (data.content) {
        setMySales(data.content);
        setSalesTotalPages(data.totalPages || 1);
      } else if (Array.isArray(data)) {
        setMySales(data);
        setSalesTotalPages(1);
      } else {
        setMySales(data.sales || data.ventas || []);
      }
    } catch (err) {
      console.error('Error loading sales:', err);
    } finally {
      setSalesLoading(false);
    }
  }, [userId, salesPage]);

  const loadMyCommission = useCallback(async () => {
    if (!userId) return;
    try {
      const simpleResponse = await getMyCommission(userId);
      let commissionValue = 0;
      if (typeof simpleResponse.data === 'number') {
        commissionValue = simpleResponse.data;
      } else if (simpleResponse.data?.totalCommission !== undefined) {
        commissionValue = simpleResponse.data.totalCommission;
      } else if (simpleResponse.data?.amount !== undefined) {
        commissionValue = simpleResponse.data.amount;
      }
      setMonthlyCommission(commissionValue);

      const statsResponse = await getCommissionStats(userId);
      if (statsResponse.data) {
        setCommissionStats(statsResponse.data);
      }
    } catch (err) {
      console.error('Error loading commission:', err);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadUserProfile();
      loadMySales();
      loadMyCommission();
    }
  }, [userId, salesPage, loadUserProfile, loadMySales, loadMyCommission]);

  // Pending sales count
  const pendingSalesCount = useMemo(() =>
    mySales.filter(
      sale => (sale.status?.toUpperCase() === 'PENDING' || sale.status?.toUpperCase() === 'REJECTED') && sale.paymentStatus !== 'PAID'
    ).length,
    [mySales]
  );

  // Computed statistics
  const computedStats = useMemo(() => ({
    totalSalesAmount: mySales.reduce((acc, sale) => acc + (sale.total || sale.totalAmount || 0), 0),
    approvedSalesCount: mySales.filter(sale => sale.status?.toUpperCase() === 'APPROVED').length,
    underReviewSalesCount: mySales.filter(sale => sale.status?.toUpperCase() === 'UNDER_REVIEW' || sale.status?.toUpperCase() === 'IN_REVIEW').length,
    pendingSalesCount: mySales.filter(sale => sale.status?.toUpperCase() === 'PENDING').length,
    rejectedSalesCount: mySales.filter(sale => sale.status?.toUpperCase() === 'REJECTED').length,
    approvedCommission: mySales
      .filter(sale => sale.status?.toUpperCase() === 'APPROVED')
      .reduce((acc, sale) => acc + ((sale.total || sale.totalAmount || 0) * commissionPercentage / 100), 0),
    underReviewCommission: mySales
      .filter(sale => sale.status?.toUpperCase() === 'UNDER_REVIEW' || sale.status?.toUpperCase() === 'IN_REVIEW')
      .reduce((acc, sale) => acc + ((sale.total || sale.totalAmount || 0) * commissionPercentage / 100), 0),
    pendingCommission: mySales
      .filter(sale => sale.status?.toUpperCase() === 'PENDING' || sale.status?.toUpperCase() === 'REJECTED')
      .reduce((acc, sale) => acc + ((sale.total || sale.totalAmount || 0) * commissionPercentage / 100), 0),
  }), [mySales, commissionPercentage]);

  // Filtered and sorted sales
  const filteredSales = useMemo(() =>
    mySales
      .filter(sale => {
        if (salesStatusFilter === 'ALL') return true;
        return sale.status?.toUpperCase() === salesStatusFilter;
      })
      .sort((a, b) => {
        switch (salesSortBy) {
          case 'date_oldest': {
            const dateA = new Date(a.orderDate || a.date || a.createdAt || 0);
            const dateB = new Date(b.orderDate || b.date || b.createdAt || 0);
            return dateA - dateB;
          }
          case 'price_highest':
            return (b.total || b.totalAmount || 0) - (a.total || a.totalAmount || 0);
          case 'price_lowest':
            return (a.total || a.totalAmount || 0) - (b.total || b.totalAmount || 0);
          default: {
            const dateA = new Date(a.orderDate || a.date || a.createdAt || 0);
            const dateB = new Date(b.orderDate || b.date || b.createdAt || 0);
            return dateB - dateA;
          }
        }
      }),
    [mySales, salesStatusFilter, salesSortBy]
  );

  const activeFilterCount = (salesStatusFilter !== 'ALL' ? 1 : 0) + (salesSortBy !== 'date_newest' ? 1 : 0);

  const clearFilters = useCallback(() => {
    setSalesStatusFilter('ALL');
    setSalesSortBy('date_newest');
  }, []);

  return {
    // Sales data
    mySales,
    salesLoading,
    salesPage,
    setSalesPage,
    salesTotalPages,
    selectedSale,
    setSelectedSale,
    loadMySales,

    // Filtering
    salesStatusFilter,
    setSalesStatusFilter,
    salesSortBy,
    setSalesSortBy,
    showFilterDropdown,
    setShowFilterDropdown,
    filteredSales,
    activeFilterCount,
    clearFilters,

    // Commission
    monthlyCommission,
    commissionStats,
    commissionPercentage,
    loadMyCommission,

    // Computed
    pendingSalesCount,
    computedStats,
  };
}
