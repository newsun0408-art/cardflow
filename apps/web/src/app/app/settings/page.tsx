import { Avatar, Button, Card, Col, Divider, Input, Row, Space, Tag } from 'antd';
import styles from './SettingsPage.module.css';

export default function SettingsPage() {
  return (
    <Space className={styles.page} orientation="vertical" size="large">
      <div>
        <h1>Cài đặt tài khoản</h1>
        <p>Quản lý thông tin hồ sơ, bảo mật và phiên đăng nhập của bạn.</p>
      </div>

      <Row gutter={[16, 16]}>
        <Col lg={16} xs={24}>
          <Card title="Thông tin cá nhân">
            <div className={styles.profile}>
              <Avatar size="large">CF</Avatar>
              <div>
                <strong>Thông tin hồ sơ</strong>
                <p>Cập nhật khi tính năng quản lý tài khoản được kết nối.</p>
              </div>
            </div>
            <Divider />
            <div className={styles.fields}>
              <label htmlFor="settings-name">
                Họ và tên
                <Input id="settings-name" placeholder="Tên của bạn" />
              </label>
              <label htmlFor="settings-email">
                Email
                <Input id="settings-email" placeholder="email@company.com" type="email" />
              </label>
            </div>
          </Card>
        </Col>

        <Col lg={8} xs={24}>
          <Space className={styles.sidebar} orientation="vertical" size="middle">
            <Card title="Trạng thái phiên">
              <Space orientation="vertical" size="small">
                <Tag>Đã đăng nhập</Tag>
                <p>Phiên hiện tại được bảo vệ bằng cookie bảo mật.</p>
                <Button href="/api/auth/logout">Đăng xuất</Button>
              </Space>
            </Card>

            <Card title="Đăng nhập tài khoản khác">
              <p>Chuyển sang một tài khoản khác để tiếp tục làm việc.</p>
              <Button block href="/login" type="primary">
                Đăng nhập
              </Button>
            </Card>
          </Space>
        </Col>
      </Row>
    </Space>
  );
}
