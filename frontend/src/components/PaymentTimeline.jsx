import { Steps } from 'antd';
import { ClockCircleOutlined, LoadingOutlined, CheckCircleOutlined } from '@ant-design/icons';

const STEP_ITEMS = [
  {
    title: 'Initiated',
    icon: <ClockCircleOutlined />,
  },
  {
    title: 'Processing',
    icon: <LoadingOutlined />,
  },
  {
    title: 'Completed',
    icon: <CheckCircleOutlined />,
  },
];

export default function PaymentTimeline({ currentStep = 0 }) {
  const items = STEP_ITEMS.map((item, index) => ({
    ...item,
    status:
      index < currentStep
        ? 'finish'
        : index === currentStep
          ? 'process'
          : 'wait',
    icon:
      index < currentStep ? (
        <CheckCircleOutlined className="!text-green-600" />
      ) : (
        item.icon
      ),
  }));

  return (
    <div className="payment-timeline-wrapper">
      <Steps
        current={currentStep}
        items={items}
        className="payment-timeline"
      />
      <style>{`
        .payment-timeline .ant-steps-item-process .ant-steps-item-icon {
          transform: scale(1.1);
          transition: transform 0.2s ease;
        }
        .payment-timeline .ant-steps-item-finish .ant-steps-item-icon {
          border-color: rgb(34 197 94) !important;
          background-color: rgb(34 197 94) !important;
        }
        .payment-timeline .ant-steps-item-finish .ant-steps-item-icon .anticon {
          color: white !important;
        }
        .payment-timeline .ant-steps-item-tail::after {
          background: linear-gradient(90deg, rgb(34 197 94), #d9d9d9) !important;
        }
      `}</style>
    </div>
  );
}
