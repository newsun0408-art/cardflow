import { Button, Card, Col, Row, Space, Statistic } from 'antd';

const SUMMARY = [
  { title: 'Thẻ đang hoạt động', value: 3 },
  { title: 'Số dư khả dụng', value: 12500000, suffix: '₫' },
  { title: 'Giao dịch tháng này', value: 24 },
  { title: 'Cần xác nhận', value: 1 },
];

export default function AppHome() {
  return (
    <Space orientation="vertical" size="large" style={{ display: 'flex' }}>
      <div>
        <h1>Dashboard</h1>
        <p>Theo dõi nhanh tình trạng thẻ và giao dịch của bạn.</p>
      </div>

      <Row gutter={[16, 16]}>
        {SUMMARY.map(({ title, value, suffix }) => (
          <Col key={title} lg={6} md={12} xs={24}>
            <Card><Statistic title={title} value={value} suffix={suffix} /></Card>
          </Col>
        ))}
      </Row>

      <Card title="Thao tác nhanh">
        <Space wrap>
          <Button href="/app/cards" type="primary">Xem danh sách thẻ</Button>
          <Button href="/app/transactions">Lịch sử giao dịch</Button>
          <Button href="/app/settings">Cài đặt tài khoản</Button>
        </Space>
      </Card>
    </Space>
  );
}
