/**
 * 推荐链接API调用函数
 */

const API_BASE = '/v1/referral';

export interface ReferralLink {
  id: number;
  exchange_name: string;
  invite_code?: string;
  commission_rate?: string;
  referral_url?: string;
  description?: string;
  exchange_type: 'CEX' | 'DEX';
  icon_url?: string;
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface ReferralListResponse {
  success: boolean;
  data: {
    list: ReferralLink[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface ReferralResponse {
  success: boolean;
  message: string;
  data?: any;
}

// 获取推荐链接列表
export async function getReferralList(params: {
  page?: number;
  limit?: number;
  type?: string;
  search?: string;
} = {}): Promise<ReferralListResponse> {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.type) queryParams.append('type', params.type);
  if (params.search) queryParams.append('search', params.search);
  
  const response = await fetch(`${API_BASE}/list?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  return response.json();
}

// 创建推荐链接
export async function createReferralLink(data: Partial<ReferralLink>): Promise<ReferralResponse> {
  const response = await fetch(`${API_BASE}/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  return response.json();
}

// 更新推荐链接
export async function updateReferralLink(id: number, data: Partial<ReferralLink>): Promise<ReferralResponse> {
  const response = await fetch(`${API_BASE}/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, ...data }),
  });
  
  return response.json();
}

// 删除推荐链接
export async function deleteReferralLink(id: number): Promise<ReferralResponse> {
  const response = await fetch(`${API_BASE}/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id }),
  });
  
  return response.json();
}
