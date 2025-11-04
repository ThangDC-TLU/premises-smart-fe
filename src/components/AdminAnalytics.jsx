// src/components/AdminAnalytics.jsx
import { useEffect, useMemo, useState } from "react";
import { Row, Col, Card, Statistic, Space, Typography } from "antd";
import { Bar, Column, Line, Pie } from "@ant-design/plots";

const { Text } = Typography;
const API = import.meta.env.VITE_API_BASE || "http://localhost:8089/api";

// ======= Formatters =======
const nf0 = new Intl.NumberFormat("vi-VN");
const nf = (v) => nf0.format(Math.round(v || 0));
const money = (v) => nf0.format(Math.round(v || 0)) + " đ";
const sqm = (v) => nf0.format(Math.round(v || 0)) + " m²";
function shortNum(val) {
  const n = Number(val || 0);
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.00$/, "") + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return nf(n);
}

// ======= Theme & common styles (đổi đồng loạt màu chữ) =======
const CHART_TEXT = "#141414"; // đen
const COMMON_THEME = {
  // áp cho G2Plot/AntV
  components: {
    legend: { // chữ ở legend
      common: { itemName: { style: { fill: CHART_TEXT, fontWeight: 600 } } },
    },
    axis: {   // chữ ở trục
      common: {
        label: { style: { fill: CHART_TEXT } },
        title: { style: { fill: CHART_TEXT } },
      },
    },
    tooltip: {
      domStyles: {
        "g2-tooltip": { color: CHART_TEXT },
        "g2-tooltip-title": { color: CHART_TEXT, fontWeight: 600 },
        "g2-tooltip-list-item": { color: CHART_TEXT },
      },
    },
  },
  // styleSheet giúp một số chart vẫn theo màu chữ này
  styleSheet: { textColor: CHART_TEXT },
};

export default function AdminAnalytics({ days = 30 }) {
  // ----- states -----
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({ totalPosts: 0, avgPrice: 0, postsToday: 0 });
  const [avgPriceByType, setAvgPriceByType] = useState([]);
  const [countByType, setCountByType] = useState([]);
  const [avgPriceByDay, setAvgPriceByDay] = useState([]);
  const [countByDay, setCountByDay] = useState([]);
  const [topUsersByType, setTopUsersByType] = useState([]);
  const [areaRange, setAreaRange] = useState([]);

  // ----- fetch -----
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const [ov, tAvg, pie, aDay, cDay, topUsers, aRange] = await Promise.all([
          fetch(`${API}/stats/overview`).then((r) => r.json()),
          fetch(`${API}/stats/avg-price-by-type`).then((r) => r.json()),
          fetch(`${API}/stats/count-by-type`).then((r) => r.json()),
          fetch(`${API}/stats/avg-price-by-day?days=${days}`).then((r) => r.json()),
          fetch(`${API}/stats/count-by-day?days=${days}`).then((r) => r.json()),
          fetch(`${API}/stats/top-users-by-type?limit=5`).then((r) => r.json()),
          fetch(`${API}/stats/area-range-by-type`).then((r) => r.json()),
        ]);
        if (!alive) return;
        setOverview(ov || {});
        setAvgPriceByType(tAvg || []);
        setCountByType(pie || []);
        setAvgPriceByDay(aDay || []);
        setCountByDay(cDay || []);
        setTopUsersByType(topUsers || []);
        setAreaRange(aRange || []);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [days]);

  // ----- transforms -----
  // Pie
  const pieRaw = useMemo(
    () => (countByType || []).map((x) => ({ type: String(x.label ?? "unknown"), value: Number(x.count || 0) })),
    [countByType]
  );
  const totalPie = useMemo(() => pieRaw.reduce((s, d) => s + (d.value || 0), 0), [pieRaw]);
  const pieData = useMemo(
    () => pieRaw.map((d) => ({ ...d, percent: totalPie ? d.value / totalPie : 0 })),
    [pieRaw, totalPie]
  );

  // Area min/max -> group column
  const areaSeries = useMemo(() => {
    const out = [];
    (areaRange || []).forEach((r) => {
      out.push({ label: String(r.label ?? "unknown"), kind: "Min", value: Number(r.min ?? r.mn ?? 0) });
      out.push({ label: String(r.label ?? "unknown"), kind: "Max", value: Number(r.max ?? r.mx ?? 0) });
    });
    return out;
  }, [areaRange]);

  // ----- chart configs -----
  const H = 240;

  const cfgBarAvgType = {
    data: (avgPriceByType || []).map((d) => ({ ...d, value: Number(d.value || 0), label: String(d.label || "unknown") })),
    xField: "label",
    yField: "value",
    height: H,
    legend: false,
    tooltip: { formatter: (d) => ({ name: "Giá TB", value: money(d.value) }) },
    yAxis: { label: { formatter: shortNum, style: { fill: CHART_TEXT } }, title: { style: { fill: CHART_TEXT } } },
    xAxis: { label: { style: { fill: CHART_TEXT } }, title: { style: { fill: CHART_TEXT } } },
    theme: COMMON_THEME,
  };

  // Pie: hiển thị % trong lát, màu chữ đen đậm (tránh lẫn vào lát sáng)
  const cfgPieByType = {
    data: pieData,
    angleField: "value",
    colorField: "type",
    height: H,
    radius: 0.9,
    label: {
      type: "inner",
      offset: "-30%",
      content: ({ percent }) => `${((percent || 0) * 100).toFixed(1)}%`,
      style: {
        fill: CHART_TEXT,
        fontSize: 14,
        fontWeight: 700,
        pointerEvents: "none",
      },
    },
    legend: { position: "top", itemName: { style: { fill: CHART_TEXT, fontWeight: 600 } } },
    tooltip: {
      showTitle: false,
      formatter: (d) => ({
        name: d.type,
        value: `${nf(d.value)} bài (${totalPie ? ((d.value / totalPie) * 100).toFixed(1) : "0.0"}%)`,
      }),
    },
    interactions: [{ type: "element-active" }],
    theme: COMMON_THEME,
  };

  const cfgLineAvgDay = {
    data: (avgPriceByDay || []).map((d) => ({ day: d.day, value: Number(d.value || 0) })),
    xField: "day",
    yField: "value",
    height: H,
    tooltip: { formatter: (d) => ({ name: "Giá TB", value: money(d.value) }) },
    yAxis: { label: { formatter: shortNum, style: { fill: CHART_TEXT } }, title: { style: { fill: CHART_TEXT } } },
    xAxis: { label: { style: { fill: CHART_TEXT } }, title: { style: { fill: CHART_TEXT } } },
    theme: COMMON_THEME,
  };

  const cfgLineCountDay = {
    data: (countByDay || []).map((d) => ({ day: d.day, count: Number(d.count || 0) })),
    xField: "day",
    yField: "count",
    height: H,
    tooltip: { formatter: (d) => ({ name: "Bài", value: nf(d.count) }) },
    yAxis: { label: { formatter: shortNum, style: { fill: CHART_TEXT } }, title: { style: { fill: CHART_TEXT } } },
    xAxis: { label: { style: { fill: CHART_TEXT } }, title: { style: { fill: CHART_TEXT } } },
    theme: COMMON_THEME,
  };

  const cfgStackTopUsers = {
    data: (topUsersByType || []).map((d) => ({
      user: String(d.user ?? "unknown"),
      type: String(d.type ?? "unknown"),
      count: Number(d.count || 0),
    })),
    xField: "user",
    yField: "count",
    seriesField: "type",
    isStack: true,
    height: H,
    legend: { position: "top", itemName: { style: { fill: CHART_TEXT, fontWeight: 600 } } },
    tooltip: { formatter: (d) => ({ name: d.type, value: nf(d.count) + " bài" }) },
    yAxis: { label: { formatter: shortNum, style: { fill: CHART_TEXT } }, title: { style: { fill: CHART_TEXT } } },
    xAxis: { label: { style: { fill: CHART_TEXT } }, title: { style: { fill: CHART_TEXT } } },
    theme: COMMON_THEME,
  };

  const cfgGroupAreaRange = {
    data: areaSeries,
    isGroup: true,
    xField: "label",
    yField: "value",
    seriesField: "kind",
    height: H,
    legend: { position: "top", itemName: { style: { fill: CHART_TEXT, fontWeight: 600 } } },
    tooltip: { formatter: (d) => ({ name: d.kind, value: sqm(d.value) }) },
    yAxis: { label: { formatter: shortNum, style: { fill: CHART_TEXT } }, title: { style: { fill: CHART_TEXT } } },
    xAxis: { label: { style: { fill: CHART_TEXT } }, title: { style: { fill: CHART_TEXT } } },
    theme: COMMON_THEME,
  };

  return (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      {/* KPIs */}
      <Row gutter={[12, 12]}>
        <Col xs={24} md={8}>
          <Card size="small" loading={loading}>
            <Statistic title="Tổng bài đăng" value={overview?.totalPosts ?? 0} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small" loading={loading}>
            <Statistic title="Giá trung bình" value={nf(overview?.avgPrice ?? 0)} suffix={<Text>đ</Text>} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small" loading={loading}>
            <Statistic title="Bài đăng hôm nay" value={overview?.postsToday ?? 0} />
          </Card>
        </Col>
      </Row>

      {/* Hàng 1 */}
      <Row gutter={[12, 12]}>
        <Col xs={24} lg={12}>
          <Card size="small" title="Giá trung bình theo loại hình" loading={loading} bodyStyle={{ padding: 8 }}>
            <Bar {...cfgBarAvgType} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card size="small" title="Tỷ trọng bài đăng theo loại hình" loading={loading} bodyStyle={{ padding: 8 }}>
            <Pie {...cfgPieByType} />
          </Card>
        </Col>
      </Row>

      {/* Hàng 2 */}
      <Row gutter={[12, 12]}>
        <Col xs={24} lg={12}>
          <Card size="small" title={`Giá trung bình theo ngày (≈${days} ngày)`} loading={loading} bodyStyle={{ padding: 8 }}>
            <Line {...cfgLineAvgDay} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card size="small" title={`Số lượng bài đăng theo ngày (≈${days} ngày)`} loading={loading} bodyStyle={{ padding: 8 }}>
            <Line {...cfgLineCountDay} />
          </Card>
        </Col>
      </Row>

      {/* Hàng 3 */}
      <Row gutter={[12, 12]}>
        <Col xs={24} lg={12}>
        </Col>
        <Col xs={24} lg={12}>
          <Card size="small" title="Khoảng diện tích theo loại hình (Min/Max)" loading={loading} bodyStyle={{ padding: 8 }}>
            <Column {...cfgGroupAreaRange} />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
