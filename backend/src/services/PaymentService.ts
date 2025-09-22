// @ts-ignore
const axios = require('axios');
// @ts-ignore
const { URLSearchParams } = require('url');
// Ambient declarations for Node globals in this project context
// @ts-ignore
declare var process: any;
// @ts-ignore
declare var Buffer: any;
// @ts-ignore
declare var console: any;

export interface PaymentConfig {
  baseUrl: string;
  secretKey: string;
  notifyUrl: string;
  returnUrl: string;
}

export interface CreateOrderRequest {
  payId: string;
  type: number; // 1=微信, 2=支付宝
  price: number;
  param?: string;
  isHtml?: number;
  returnUrl?: string;
  notifyUrl?: string;
}

export interface CreateOrderResponse {
  code: number;
  msg: string;
  data: {
    payId: string;
    orderId: string;
    payType: number;
    price: number;
    reallyPrice: number;
    payUrl: string;
    isAuto: number;
    state: number;
    timeOut: number;
    date: number;
  } | null;
}

export interface PaymentCallback {
  payId: string;
  param: string;
  type: number;
  price: number;
  reallyPrice: number;
  sign: string;
}

export class PaymentService {
  private config: PaymentConfig;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.config = {
      baseUrl: 'https://2282045.pay.lanjingzf.com',
      secretKey: process.env.PAYMENT_SECRET_KEY || '08b19b019aa86ce42b30ce1c38110bb2',
      notifyUrl: process.env.PAYMENT_NOTIFY_URL || 'http://localhost:9000/api/payment/notify',
      returnUrl: process.env.PAYMENT_RETURN_URL || 'http://localhost:9000/api/payment/return'
    };
  }

  // 生成MD5签名
  private generateMD5(input: string): string {
    // 运行时由蓝鲸平台规则决定，这里仅做占位，真实签名在 createOrderSign 中完成
    // 在 Node 环境我们使用内置 crypto
    // @ts-ignore
    const crypto = require('crypto');
    return crypto.createHash('md5').update(input).digest('hex');
  }

  // 创建订单签名
  private createOrderSign(payId: string, param: string, type: number, price: number): string {
    const signString = `${payId}${param}${type}${price}${this.config.secretKey}`;
    return this.generateMD5(signString);
  }

  // 验证回调签名
  private verifyCallbackSign(payId: string, param: string, type: number, price: number, reallyPrice: number, sign: string): boolean {
    const signString = `${payId}${param}${type}${price}${reallyPrice}${this.config.secretKey}`;
    const calculatedSign = this.generateMD5(signString);
    return calculatedSign === sign;
  }

  // 关闭订单签名
  private closeOrderSign(orderId: string): string {
    const signString = `${orderId}${this.config.secretKey}`;
    return this.generateMD5(signString);
  }

  // 创建支付订单
  async createPaymentOrder(orderData: {
    orderId: string;
    productId: string;
    paymentType: 'wechat' | 'alipay';
    amount: number; // 单位：分
    contactInfo: string;
  }): Promise<{
    success: boolean;
    payUrl?: string;
    cloudOrderId?: string;
    error?: string;
  }> {
    try {
      const payId = orderData.orderId;
      const type = orderData.paymentType === 'wechat' ? 1 : 2;
      const price = orderData.amount / 100; // 元
      const param = JSON.stringify({
        productId: orderData.productId,
        contactInfo: orderData.contactInfo,
        orderId: orderData.orderId
      });

      const sign = this.createOrderSign(payId, param, type, price);

      const requestData = new URLSearchParams({
        payId,
        type: type.toString(),
        price: price.toString(),
        sign,
        param,
        isHtml: '1', // 让平台返回H5收银台页面
        returnUrl: this.config.returnUrl,
        notifyUrl: this.config.notifyUrl
      });

      const response = await axios.post(
        `${this.config.baseUrl}/createOrder`,
        requestData,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 10000,
          responseType: 'arraybuffer'
        }
      );

      // 先尝试 JSON
      try {
        const text = Buffer.from(response.data as any, 'binary').toString('utf8');
        const maybeJson = JSON.parse(text);
        if (maybeJson && maybeJson.code === 1 && maybeJson.data && maybeJson.data.payUrl) {
          return {
            success: true,
            payUrl: maybeJson.data.payUrl,
            cloudOrderId: maybeJson.data.orderId
          };
        }
      } catch (_) {}

      // HTML 回退（含 GBK）
      const htmlUtf8 = Buffer.from(response.data as any, 'binary').toString('utf8');
      let html = htmlUtf8;
      if (/charset=gbk|charset=gb2312/i.test(htmlUtf8)) {
        try {
          // @ts-ignore
          const iconv = require('iconv-lite');
          html = iconv.decode(Buffer.from(response.data as any), 'gbk');
        } catch (_) {}
      }
      const match = html.match(/window\.location\.href\s*=\s*'([^']+)'/i);
      if (match && match[1]) {
        const payUrl = `${this.config.baseUrl}${match[1]}`;
        return {
          success: true,
          payUrl,
          cloudOrderId: (payUrl.split('orderId=')[1] || '').split('&')[0]
        };
      }

      return { success: false, error: '创建支付订单失败（返回不可解析）' };
    } catch (error) {
      console.log('Payment order creation failed:', error);
      return { success: false, error: '网络错误，请重试' };
    }
  }

  // 验证支付回调
  verifyPaymentCallback(callback: PaymentCallback): {
    success: boolean;
    orderData?: {
      orderId: string;
      productId: string;
      contactInfo: string;
    };
    error?: string;
  } {
    try {
      if (this.isDevelopment && callback.sign === 'mock_signature') {
        console.log('Development mode: Skipping signature verification for mock payment');
      } else {
        const isValidSign = this.verifyCallbackSign(
          callback.payId,
          callback.param,
          callback.type,
          callback.price,
          callback.reallyPrice,
          callback.sign
        );
        if (!isValidSign) {
          return { success: false, error: 'Invalid signature' };
        }
      }

      let orderData;
      try {
        orderData = JSON.parse(callback.param);
      } catch (e) {
        return { success: false, error: 'Invalid param format' };
      }

      return {
        success: true,
        orderData: {
          orderId: callback.payId,
          productId: orderData.productId,
          contactInfo: orderData.contactInfo
        }
      };
    } catch (error) {
      console.log('Callback verification failed:', error);
      return { success: false, error: 'Verification failed' };
    }
  }

  // 关闭订单
  async closeOrder(cloudOrderId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const sign = this.closeOrderSign(cloudOrderId);
      const requestData = new URLSearchParams({ orderId: cloudOrderId, sign });
      const response = await axios.post(
        `${this.config.baseUrl}/closeOrder`,
        requestData,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000 }
      );
      const data = response.data;
      if (data && data.code === 1) return { success: true };
      return { success: false, error: data?.msg || '关闭订单失败' };
    } catch (error) {
      console.log('Close order failed:', error);
      return { success: false, error: '网络错误，请重试' };
    }
  }
}
