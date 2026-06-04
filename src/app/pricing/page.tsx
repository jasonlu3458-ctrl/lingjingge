import PricingPage from './PricingPage'

export async function generateMetadata() {
  return {
    title: '会员订阅 - 灵境阁',
    description: '选择适合您的修行之路'
  }
}

export default function PricingWrapper() {
  return <PricingPage />
}