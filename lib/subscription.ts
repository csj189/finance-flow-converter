// 订阅与付费鉴权模块
// MVP 阶段提供最小实现：通过 .env 的 SUBSCRIBER_KEYS 维护一组已订阅标识（逗号分隔），
// 请求携带 X-Subscriber-Key 进行鉴权。生产环境应替换为接入支付服务（Stripe 等）。

const getSubscriberKeys = (): Set<string> => {
  const raw = process.env.SUBSCRIBER_KEYS || '';
  return new Set(raw.split(',').map((s) => s.trim()).filter(Boolean));
};

/** 校验订阅密钥是否有效 */
export function isSubscribed(key?: string | null): boolean {
  if (!key) return false;
  return getSubscriberKeys().has(key);
}
