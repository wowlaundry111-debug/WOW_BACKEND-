import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Trophy,
  Users,
  TrendingUp,
  BarChart2,
  CreditCard,
  Layers,
  Filter,
  Zap,
} from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPO, NEO_SHADOW } from '../../components/Theme';
import { useAppStore } from '../../store/useAppStore';

export const AdminDashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    orders,
    users,
    shops,
    currentTenantId,
    currentUser,
    fetchOrders,
    fetchUsers,
    fetchCatalog,
  } = useAppStore();

  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'today' | 'yesterday' | '7days' | '30days' | 'this_month' | 'all'>('all');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchOrders(1), fetchUsers(), fetchCatalog()]);
    setRefreshing(false);
  }, [fetchOrders, fetchUsers, fetchCatalog]);

  const activeShopId = currentTenantId || currentUser?.shopId || '';
  const currentShop = shops.find((s) => s._id === activeShopId);
  
  const tenantOrders = activeShopId
    ? orders.filter((o) => o.shopId === activeShopId)
    : orders;

  // ─── Filtered Orders Calculation ────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return tenantOrders.filter((o) => {
      const orderDate = new Date(o.createdAt || Date.now());

      if (timeRange === 'today') {
        return orderDate >= todayStart;
      }
      if (timeRange === 'yesterday') {
        const yestStart = new Date(todayStart);
        yestStart.setDate(yestStart.getDate() - 1);
        const yestEnd = new Date(todayStart);
        return orderDate >= yestStart && orderDate < yestEnd;
      }
      if (timeRange === '7days') {
        const d7 = new Date(now);
        d7.setDate(d7.getDate() - 7);
        return orderDate >= d7;
      }
      if (timeRange === '30days') {
        const d30 = new Date(now);
        d30.setDate(d30.getDate() - 30);
        return orderDate >= d30;
      }
      if (timeRange === 'this_month') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return orderDate >= monthStart;
      }
      return true; // 'all'
    });
  }, [tenantOrders, timeRange]);

  // ─── Key Performance Indicators (KPIs) ──────────────────────────────────────
  const totalRevenue = useMemo(() => {
    return filteredOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  }, [filteredOrders]);

  const totalOrdersCount = filteredOrders.length;

  const deliveredOrdersCount = useMemo(() => {
    return filteredOrders.filter((o) => o.status === 'DELIVERED').length;
  }, [filteredOrders]);

  const pendingOrdersCount = useMemo(() => {
    return filteredOrders.filter((o) =>
      ['PLACED', 'ACCEPTED', 'PICKUP_ASSIGNED', 'WASHING', 'IRONING', 'OUT_FOR_DELIVERY'].includes(o.status)
    ).length;
  }, [filteredOrders]);

  const cancelledOrdersCount = useMemo(() => {
    return filteredOrders.filter((o) => o.status === 'CANCELLED').length;
  }, [filteredOrders]);

  const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

  const deliveryBoys = users.filter(
    (u) => u.role === 'Delivery' && (!activeShopId || !u.shopId || u.shopId === activeShopId)
  );

  // ─── Payment Mode Breakdown ────────────────────────────────────────────────
  const cashRevenue = useMemo(() => {
    return filteredOrders
      .filter((o) => o.paymentMode === 'COD')
      .reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  }, [filteredOrders]);

  const onlineRevenue = useMemo(() => {
    return filteredOrders
      .filter((o) => o.paymentMode === 'UPI' || o.paymentMode === 'CARD' || o.paymentMode === 'ONLINE')
      .reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  }, [filteredOrders]);

  const cashOrdersCount = filteredOrders.filter((o) => o.paymentMode === 'COD').length;
  const onlineOrdersCount = filteredOrders.filter((o) => ['UPI', 'CARD', 'ONLINE'].includes(o.paymentMode as any)).length;

  // ─── Revenue & Order Trend Buckets (Graph Data) ────────────────────────────
  const trendGraphData = useMemo(() => {
    if (filteredOrders.length === 0) return [];

    const isHourly = timeRange === 'today' || timeRange === 'yesterday';

    if (isHourly) {
      const hoursMap: Record<string, { label: string; revenue: number; orders: number }> = {};
      for (let h = 0; h < 24; h += 2) {
        const label = `${String(h).padStart(2, '0')}:00`;
        hoursMap[label] = { label, revenue: 0, orders: 0 };
      }
      filteredOrders.forEach((o) => {
        const d = new Date(o.createdAt || Date.now());
        const h = Math.floor(d.getHours() / 2) * 2;
        const label = `${String(h).padStart(2, '0')}:00`;
        if (hoursMap[label]) {
          hoursMap[label].revenue += o.totalAmount || 0;
          hoursMap[label].orders += 1;
        }
      });
      return Object.values(hoursMap);
    } else {
      const daysMap: Record<string, { label: string; dateObj: Date; revenue: number; orders: number }> = {};
      filteredOrders.forEach((o) => {
        const d = new Date(o.createdAt || Date.now());
        const key = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }).toUpperCase();
        if (!daysMap[key]) {
          daysMap[key] = { label: key, dateObj: d, revenue: 0, orders: 0 };
        }
        daysMap[key].revenue += o.totalAmount || 0;
        daysMap[key].orders += 1;
      });

      return Object.values(daysMap)
        .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
        .slice(-10); // Clean 10-day timeline window for mobile screens
    }
  }, [filteredOrders, timeRange]);

  const maxBucketRevenue = useMemo(() => {
    return Math.max(...trendGraphData.map((b) => b.revenue), 1);
  }, [trendGraphData]);

  // Compute Y-Axis Grid Marks (4 intervals)
  const yAxisTicks = useMemo(() => {
    return [
      maxBucketRevenue,
      maxBucketRevenue * 0.66,
      maxBucketRevenue * 0.33,
      0
    ];
  }, [maxBucketRevenue]);

  // Top Customers Leaderboard
  const topCustomers = useMemo(() => {
    const stats: Record<string, { id: string; name: string; orders: number; amount: number }> = {};
    filteredOrders.forEach((o) => {
      const customer = users.find((u) => u._id === o.customerId);
      const name = customer?.name || o.customerName || 'Customer';
      const id = o.customerId || name;
      if (!stats[id]) stats[id] = { id, name, orders: 0, amount: 0 };
      stats[id].orders += 1;
      stats[id].amount += o.totalAmount || 0;
    });
    return Object.values(stats)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [filteredOrders, users]);

  const formatCompactNumber = (num: number) => {
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}k`;
    return `₹${num.toFixed(0)}`;
  };

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      style={styles.root}
      contentContainerStyle={[styles.scrollContent, { paddingTop: (insets.top > 0 ? insets.top : 44) + 8 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
    >
      {/* Title & Live Badge */}
      <View style={styles.titleWrap}>
        <View style={styles.titleRow}>
          <Text style={styles.heading}>DASHBOARD</Text>
          <View style={styles.liveBadge}>
            <Zap size={10} color={COLORS.black} fill={COLORS.black} />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
        </View>
        <Text style={styles.subHeading}>
          Pulse for {currentShop ? currentShop.name : 'All Shops'}
        </Text>
      </View>

      {/* Date Range Filter Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        <View style={styles.filterWrap}>
          <Filter size={14} color={COLORS.black} style={{ marginRight: 4 }} />
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: '7days', label: '7 Days' },
            { id: '30days', label: '30 Days' },
            { id: 'this_month', label: 'Month' },
            { id: 'all', label: 'All Time' },
          ].map((btn) => {
            const isActive = timeRange === btn.id;
            return (
              <TouchableOpacity
                key={btn.id}
                activeOpacity={0.8}
                onPress={() => setTimeRange(btn.id as any)}
                style={[
                  styles.filterBtn,
                  isActive && styles.filterBtnActive,
                ]}
              >
                <Text style={[styles.filterBtnText, isActive && styles.filterBtnTextActive]}>
                  {btn.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bento Grid KPI Cards */}
      <View style={styles.bentoGrid}>
        {/* Card 1: Total Sales Revenue */}
        <View style={[styles.bentoCard, { backgroundColor: COLORS.secondary }]}>
          <View style={styles.bentoCardTop}>
            <Text style={styles.bentoCardLabel}>TOTAL REVENUE</Text>
            <TrendingUp size={16} color={COLORS.black} strokeWidth={3} />
          </View>
          <View>
            <Text style={styles.bentoCardValue}>
              ₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </Text>
            <View style={styles.bentoTagWhite}>
              <Text style={styles.bentoTagText}>{totalOrdersCount} Total Orders</Text>
            </View>
          </View>
        </View>

        {/* Card 2: Avg Order Value */}
        <View style={[styles.bentoCard, { backgroundColor: COLORS.white }]}>
          <View style={styles.bentoCardTop}>
            <Text style={styles.bentoCardLabel}>AVG ORDER VALUE</Text>
            <BarChart2 size={16} color={COLORS.primary} strokeWidth={3} />
          </View>
          <View>
            <Text style={styles.bentoCardValue}>₹{avgOrderValue.toFixed(0)}</Text>
            <View style={styles.bentoTagGray}>
              <Text style={styles.bentoTagText}>Per Order Avg</Text>
            </View>
          </View>
        </View>

        {/* Card 3: Active Queue */}
        <View style={[styles.bentoCard, { backgroundColor: COLORS.primary }]}>
          <View style={styles.bentoCardTop}>
            <Text style={[styles.bentoCardLabel, { color: COLORS.white }]}>ACTIVE QUEUE</Text>
            <Layers size={16} color={COLORS.secondary} strokeWidth={3} />
          </View>
          <View>
            <Text style={[styles.bentoCardValue, { color: COLORS.white }]}>{pendingOrdersCount}</Text>
            <View style={styles.bentoTagBlack}>
              <Text style={[styles.bentoTagText, { color: COLORS.secondary }]}>
                {deliveredOrdersCount} Delivered
              </Text>
            </View>
          </View>
        </View>

        {/* Card 4: Active Fleet */}
        <View style={[styles.bentoCard, { backgroundColor: COLORS.white }]}>
          <View style={styles.bentoCardTop}>
            <Text style={styles.bentoCardLabel}>ACTIVE FLEET</Text>
            <Users size={16} color={COLORS.black} strokeWidth={3} />
          </View>
          <View>
            <Text style={styles.bentoCardValue}>{deliveryBoys.length}</Text>
            <View style={styles.bentoTagGray}>
              <Text style={styles.bentoTagText}>Agents Assigned</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ─── GRAPHICAL REVENUE & SALES TRAJECTORY BAR CHART ───────────────── */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View style={styles.chartHeaderLeft}>
            <BarChart2 size={20} color={COLORS.primary} strokeWidth={3} />
            <Text style={styles.chartTitle}>REVENUE TRAJECTORY</Text>
          </View>
          <View style={styles.chartLegendBadge}>
            <Text style={styles.chartLegendText}>₹ REVENUE</Text>
          </View>
        </View>

        {trendGraphData.length === 0 ? (
          <View style={styles.chartEmptyBox}>
            <BarChart2 size={32} color="#9CA3AF" />
            <Text style={styles.chartEmptyText}>No order activity in this date range</Text>
          </View>
        ) : (
          <View style={styles.chartContainer}>
            {/* Gridlines */}
            <View style={styles.gridLinesContainer}>
              {yAxisTicks.map((val, idx) => (
                <View key={idx} style={styles.gridLineRow}>
                  <Text style={styles.yAxisText}>{formatCompactNumber(val)}</Text>
                  <View style={styles.gridLine} />
                </View>
              ))}
            </View>

            {/* Bars */}
            <View style={styles.barsRow}>
              {trendGraphData.map((bucket, idx) => {
                const heightPercent = maxBucketRevenue > 0 ? (bucket.revenue / maxBucketRevenue) * 100 : 0;
                const isHovered = hoveredIndex === idx;
                const isPeak = bucket.revenue === maxBucketRevenue && maxBucketRevenue > 0;

                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.8}
                    onPress={() => setHoveredIndex(isHovered ? null : idx)}
                    style={styles.barColumn}
                  >
                    {/* Value Badge above Bar */}
                    {bucket.revenue > 0 ? (
                      <View style={[styles.barValBadge, isPeak && styles.barValBadgePeak]}>
                        <Text style={[styles.barValText, isPeak && { color: COLORS.secondary }]}>
                          {formatCompactNumber(bucket.revenue)}
                        </Text>
                      </View>
                    ) : null}

                    {/* Bar Pill */}
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${Math.max(heightPercent, 6)}%`,
                          backgroundColor: isHovered
                            ? COLORS.primary
                            : isPeak
                            ? COLORS.secondary
                            : COLORS.secondary,
                        },
                      ]}
                    />

                    {/* X-Axis Date Pill Container (No clipping) */}
                    <View style={styles.datePill}>
                      <Text style={styles.datePillText} numberOfLines={1}>
                        {bucket.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* ─── PAYMENT COLLECTION BREAKDOWN ─────────────────────────────────── */}
      <View style={styles.paymentCard}>
        <View style={styles.chartHeader}>
          <View style={styles.chartHeaderLeft}>
            <CreditCard size={20} color={COLORS.primary} strokeWidth={3} />
            <Text style={styles.chartTitle}>PAYMENT COLLECTION</Text>
          </View>
          <View style={styles.chartLegendBadge}>
            <Text style={styles.chartLegendText}>CHANNEL SHARE</Text>
          </View>
        </View>

        <View style={{ gap: SPACING.md, marginTop: SPACING.xs }}>
          {/* Offline Cash */}
          <View>
            <View style={styles.paymentRowHeader}>
              <Text style={styles.paymentLabel}>OFFLINE CASH (COD)</Text>
              <Text style={styles.paymentVal}>₹{cashRevenue.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${totalRevenue > 0 ? (cashRevenue / totalRevenue) * 100 : 0}%`,
                    backgroundColor: COLORS.secondary,
                  },
                ]}
              />
            </View>
            <Text style={styles.paymentSub}>
              {cashOrdersCount} Order{cashOrdersCount > 1 ? 's' : ''} ({totalOrdersCount > 0 ? ((cashOrdersCount / totalOrdersCount) * 100).toFixed(0) : 0}%)
            </Text>
          </View>

          {/* Online Payment */}
          <View>
            <View style={styles.paymentRowHeader}>
              <Text style={styles.paymentLabel}>ONLINE PAYMENT (UPI / CARD)</Text>
              <Text style={styles.paymentVal}>₹{onlineRevenue.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${totalRevenue > 0 ? (onlineRevenue / totalRevenue) * 100 : 0}%`,
                    backgroundColor: COLORS.primary,
                  },
                ]}
              />
            </View>
            <Text style={styles.paymentSub}>
              {onlineOrdersCount} Order{onlineOrdersCount > 1 ? 's' : ''} ({totalOrdersCount > 0 ? ((onlineOrdersCount / totalOrdersCount) * 100).toFixed(0) : 0}%)
            </Text>
          </View>
        </View>
      </View>

      {/* ─── TOP PERFORMERS LEADERBOARD ───────────────────────────────────── */}
      <View style={styles.sectionHeaderWrap}>
        <View style={styles.trophyIconBox}>
          <Trophy size={18} color={COLORS.black} strokeWidth={2.5} />
        </View>
        <Text style={styles.sectionTitle}>TOP CUSTOMERS LEADERBOARD</Text>
      </View>

      <View style={styles.topCustomersCard}>
        {topCustomers.length === 0 ? (
          <View style={{ padding: SPACING.lg, alignItems: 'center' }}>
            <Text style={styles.emptyText}>No customer activity in selected range.</Text>
          </View>
        ) : (
          topCustomers.map((cust, i) => (
            <View
              key={i}
              style={[
                styles.customerRow,
                i !== topCustomers.length - 1 && styles.customerRowBorder,
              ]}
            >
              <View style={styles.custAvatar}>
                <Text style={styles.custAvatarText}>{cust.name.charAt(0).toUpperCase()}</Text>
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.custName}>{cust.name}</Text>
                <Text style={styles.custOrders}>
                  {cust.orders} Order{cust.orders > 1 ? 's' : ''}
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.custAmount}>₹{cust.amount.toLocaleString('en-IN')}</Text>
                <Text style={styles.custPeriod}>In Date Range</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  titleWrap: {
    marginBottom: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heading: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.black,
  },
  subHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.secondary,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  liveBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.black,
  },
  filterScroll: {
    marginBottom: SPACING.lg,
  },
  filterWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: COLORS.black,
    padding: 4,
    borderRadius: RADIUS.md,
    gap: 4,
  },
  filterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.black,
    backgroundColor: COLORS.white,
  },
  filterBtnActive: {
    backgroundColor: COLORS.secondary,
    ...NEO_SHADOW.box4,
  },
  filterBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#374151',
    textTransform: 'uppercase',
  },
  filterBtnTextActive: {
    color: COLORS.black,
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  bentoCard: {
    width: '47%',
    borderWidth: 3,
    borderColor: COLORS.black,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    justifyContent: 'space-between',
    minHeight: 120,
    ...NEO_SHADOW.box4,
  },
  bentoCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bentoCardLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.black,
    textTransform: 'uppercase',
  },
  bentoCardValue: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.black,
    marginBottom: 4,
  },
  bentoTagWhite: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  },
  bentoTagBlack: {
    backgroundColor: COLORS.black,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  },
  bentoTagGray: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  },
  bentoTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.black,
  },

  /* Chart Styles */
  chartCard: {
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: COLORS.black,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...NEO_SHADOW.box4,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.black,
    paddingBottom: SPACING.xs,
    marginBottom: SPACING.md,
  },
  chartHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.black,
  },
  chartLegendBadge: {
    backgroundColor: COLORS.secondary,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  chartLegendText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.black,
  },
  chartEmptyBox: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
  },
  chartEmptyText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#6B7280',
    marginTop: 6,
    textTransform: 'uppercase',
  },
  chartContainer: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: RADIUS.md,
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 8,
    height: 220,
  },
  gridLinesContainer: {
    ...StyleSheet.absoluteFillObject,
    paddingTop: 30,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  gridLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yAxisText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#6B7280',
    width: 32,
    textAlign: 'right',
    marginRight: 4,
  },
  gridLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  barsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginLeft: 36,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    marginHorizontal: 2,
  },
  barValBadge: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.black,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
    marginBottom: 4,
  },
  barValBadgePeak: {
    backgroundColor: COLORS.black,
  },
  barValText: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.black,
  },
  barFill: {
    width: '80%',
    maxWidth: 24,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.black,
  },
  datePill: {
    position: 'absolute',
    bottom: -32,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.black,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  datePillText: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.black,
    textTransform: 'uppercase',
  },

  /* Payment Card Styles */
  paymentCard: {
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: COLORS.black,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...NEO_SHADOW.box4,
  },
  paymentRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  paymentLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.black,
  },
  paymentVal: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.primary,
  },
  progressBg: {
    height: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: COLORS.black,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  paymentSub: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 2,
    textTransform: 'uppercase',
  },

  /* Top Customers Leaderboard Styles */
  sectionHeaderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: 8,
  },
  trophyIconBox: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.secondary,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.black,
    textTransform: 'uppercase',
  },
  topCustomersCard: {
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: COLORS.black,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...NEO_SHADOW.box4,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  customerRowBorder: {
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.black,
  },
  custAvatar: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.secondary,
    borderWidth: 1.5,
    borderColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  custAvatarText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.black,
  },
  custName: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.black,
    textTransform: 'uppercase',
  },
  custOrders: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  custAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.primary,
  },
  custPeriod: {
    fontSize: 8,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
});
